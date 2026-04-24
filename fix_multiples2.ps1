$ErrorActionPreference = 'Stop'
$env = Get-Content .env.local | ConvertFrom-StringData
$url = $env.NEXT_PUBLIC_SUPABASE_URL
$key = $env.NEXT_PUBLIC_SUPABASE_ANON_KEY
$eventId = "280f2cea-729c-4340-8daa-0b34f2161da3"

$headers = @{
    "apikey" = $key
    "Authorization" = "Bearer $key"
    "Content-Type" = "application/json"
    "Prefer" = "return=representation"
}

$payload = @"
[
  {
    "email": "kmoralea@gmail.com",
    "fee_per_entry": 35,
    "wrestlers": [
      { "first": "Dylan", "last": "Nunez", "team": "Nc pride", "div": "HIGH SCHOOL", "wt": "HS-132" },
      { "first": "Axel", "last": "Nunez", "team": "Nc pride", "div": "HIGH SCHOOL", "wt": "HS-132" }
    ]
  },
  {
    "email": "ddmcb@protonmail.com",
    "fee_per_entry": 35,
    "wrestlers": [
      { "first": "Nathaniel", "last": "McBee", "team": "Gracie Burlington Wrestling Club", "div": "HIGH SCHOOL", "wt": "HS-157" },
      { "first": "Nathaniel", "last": "McBee", "team": "Gracie Burlington Wrestling Club", "div": "HIGH SCHOOL", "wt": "HS-165" },
      { "first": "Matthew", "last": "McBee", "team": "Gracie Burlington Wrestling Club", "div": "MIDDLE SCHOOL", "wt": "MS-126" },
      { "first": "Jonathan", "last": "McBee", "team": "Gracie Burlington Wrestling Club", "div": "BANTAM", "wt": "B-65" }
    ]
  },
  {
    "email": "houstonjpinnix@gmail.com",
    "fee_per_entry": 35,
    "wrestlers": [
      { "first": "Waylon", "last": "Pinnix", "team": "SSWA", "div": "HIGH SCHOOL", "wt": "HS-138" },
      { "first": "Emeson", "last": "Pinnix", "team": "SSWA", "div": "MIDDLE SCHOOL", "wt": "MS-83" }
    ]
  }
]
"@

$parentsData = $payload | ConvertFrom-Json

foreach ($p in $parentsData) {
    Write-Host "Processing Parent: $($p.email)"
    
    # Get Parent ID
    $parentUrl = "$url/rest/v1/parents?email=eq.$($p.email)&select=id"
    $parentReq = Invoke-RestMethod -Uri $parentUrl -Headers $headers -Method Get
    
    if ($parentReq.Count -eq 0) {
        Write-Host "Warning: Could not find parent $($p.email)"
        continue
    }
    
    $parentId = $parentReq[0].id
    
    # Delete placeholder registrations
    $delUrl = "$url/rest/v1/registrations?parent_id=eq.$parentId&event_id=eq.$eventId&division=eq.Multiple+Attendees"
    Invoke-RestMethod -Uri $delUrl -Headers $headers -Method Delete
    Write-Host "Deleted placeholder registration for $($p.email)"
    
    foreach ($w in $p.wrestlers) {
        # Upsert Wrestler
        $wFirstEnc = [uri]::EscapeDataString($w.first)
        $wLastEnc = [uri]::EscapeDataString($w.last)
        $wrestlerUrl = "$url/rest/v1/wrestlers?first_name=ilike.$wFirstEnc&last_name=ilike.$wLastEnc&select=id"
        $wrestlerReq = Invoke-RestMethod -Uri $wrestlerUrl -Headers $headers -Method Get
        
        $wrestlerId = $null
        if ($wrestlerReq.Count -gt 0) {
            $wrestlerId = $wrestlerReq[0].id
        } else {
            $newWrestler = @{
                first_name = $w.first
                last_name = $w.last
                parent_id = $parentId
                team = $w.team
            }
            $insertWrestlerReq = Invoke-RestMethod -Uri "$url/rest/v1/wrestlers" -Headers $headers -Method Post -Body ($newWrestler | ConvertTo-Json)
            if ($insertWrestlerReq.Count -gt 0) {
                $wrestlerId = $insertWrestlerReq[0].id
            }
        }
        
        # Insert Registration
        if ($wrestlerId) {
            $newReg = @{
                parent_id = $parentId
                wrestler_id = $wrestlerId
                event_id = $eventId
                division = $w.div
                weight_class = $w.wt
                fee = $p.fee_per_entry
                status = "approved"
                electronic_signature = "Legacy Import"
            }
            Invoke-RestMethod -Uri "$url/rest/v1/registrations" -Headers $headers -Method Post -Body ($newReg | ConvertTo-Json)
            Write-Host "  -> Inserted $($w.first) $($w.last)"
        }
    }
}

Write-Host "All specified multiples have been extracted!"
