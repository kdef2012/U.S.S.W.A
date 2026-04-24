$ErrorActionPreference = 'Stop'

$csvPath = "c:\Users\kdnelson\OneDrive - Winston-Salem Forsyth County Schools\Desktop\war-at-the-watertower-2-export.csv"

# Read raw text and find header line
$lines = Get-Content $csvPath
$headerIdx = -1
for ($i=0; $i -lt $lines.Count; $i++) {
    if ($lines[$i] -match '^"?Name"?,') {
        $headerIdx = $i
        break
    }
}

if ($headerIdx -eq -1) {
    Write-Host "Could not find CSV header!"
    exit
}

$env = Get-Content .env.local | ConvertFrom-StringData
$url = $env.NEXT_PUBLIC_SUPABASE_URL
$key = $env.NEXT_PUBLIC_SUPABASE_ANON_KEY
$eventId = "280f2cea-729c-4340-8daa-0b34f2161da3" # War at the WaterTower ID

$headers = @{
    "apikey" = $key
    "Authorization" = "Bearer $key"
    "Content-Type" = "application/json"
    "Prefer" = "return=representation"
}

$stats = @{
    parents = 0
    wrestlers = 0
    registrations = 0
}

# Process each data row manually
for ($i = $headerIdx + 1; $i -lt $lines.Count; $i++) {
    $line = $lines[$i]
    if ([string]::IsNullOrWhiteSpace($line)) { continue }

    # Very naive CSV split assuming no commas inside the actual text values for names/phones
    # For this specific file, we know the format.
    # We will use ConvertFrom-Csv with fake headers so it parses quotes correctly.
    $fakeHeaderLine = "C0,C1,C2,C3,C4,C5,C6,C7,C8,C9,C10,C11,C12,C13,C14,C15,C16,C17"
    $parsed = "$fakeHeaderLine`n$line" | ConvertFrom-Csv
    
    $first = $parsed.C6
    $last = $parsed.C7
    $phone = $parsed.C8
    $email = $parsed.C9
    $fee = [decimal]($parsed.C4.Replace('$',''))

    $division = $parsed.C13
    $team = $parsed.C14
    $weightClass = $parsed.C15
    $wrestlerFirst = $parsed.C16
    $wrestlerLast = $parsed.C17

    if ([string]::IsNullOrWhiteSpace($email)) { continue }

    # 1. UPSERT PARENT
    $parentUrl = "$url/rest/v1/parents?email=eq.$email&select=id"
    $parentReq = Invoke-RestMethod -Uri $parentUrl -Headers $headers -Method Get
    
    $parentId = $null
    if ($parentReq.Count -gt 0) {
        $parentId = $parentReq[0].id
    } else {
        $newParent = @{
            first_name = $first
            last_name = $last
            email = $email
            phone = $phone
        }
        $insertParentReq = Invoke-RestMethod -Uri "$url/rest/v1/parents" -Headers $headers -Method Post -Body ($newParent | ConvertTo-Json)
        if ($insertParentReq.Count -gt 0) {
            $parentId = $insertParentReq[0].id
            $stats.parents++
        }
    }

    if (-not $parentId) { continue }

    # 2. CHECK FOR MULTIPLE ATTENDEES
    if ($wrestlerFirst -eq 'Multiple Attendees' -or $division -eq 'Multiple Attendees') {
        $newReg = @{
            parent_id = $parentId
            event_id = $eventId
            wrestler_id = $null
            division = "Multiple Attendees"
            weight_class = "Multiple Attendees"
            fee = $fee
            status = "approved"
            electronic_signature = "Legacy Import"
        }
        $insertRegReq = Invoke-RestMethod -Uri "$url/rest/v1/registrations" -Headers $headers -Method Post -Body ($newReg | ConvertTo-Json)
        $stats.registrations++
        continue
    }

    if ([string]::IsNullOrWhiteSpace($wrestlerFirst) -or [string]::IsNullOrWhiteSpace($wrestlerLast)) { continue }

    # 3. UPSERT WRESTLER
    $wFirstEnc = [uri]::EscapeDataString($wrestlerFirst)
    $wLastEnc = [uri]::EscapeDataString($wrestlerLast)
    $wrestlerUrl = "$url/rest/v1/wrestlers?first_name=ilike.$wFirstEnc&last_name=ilike.$wLastEnc&select=id"
    $wrestlerReq = Invoke-RestMethod -Uri $wrestlerUrl -Headers $headers -Method Get

    $wrestlerId = $null
    if ($wrestlerReq.Count -gt 0) {
        $wrestlerId = $wrestlerReq[0].id
    } else {
        $newWrestler = @{
            first_name = $wrestlerFirst
            last_name = $wrestlerLast
            parent_id = $parentId
            team = $team
        }
        $insertWrestlerReq = Invoke-RestMethod -Uri "$url/rest/v1/wrestlers" -Headers $headers -Method Post -Body ($newWrestler | ConvertTo-Json)
        if ($insertWrestlerReq.Count -gt 0) {
            $wrestlerId = $insertWrestlerReq[0].id
            $stats.wrestlers++
        }
    }

    if (-not $wrestlerId) { continue }

    # 4. INSERT REGISTRATION
    $newReg = @{
        parent_id = $parentId
        wrestler_id = $wrestlerId
        event_id = $eventId
        division = $division
        weight_class = $weightClass
        fee = $fee
        status = "approved"
        electronic_signature = "Legacy Import"
    }
    $insertRegReq = Invoke-RestMethod -Uri "$url/rest/v1/registrations" -Headers $headers -Method Post -Body ($newReg | ConvertTo-Json)
    $stats.registrations++
}

Write-Host "War at the WaterTower Migration Complete!"
Write-Host "Parents Inserted: $($stats.parents)"
Write-Host "Wrestlers Inserted: $($stats.wrestlers)"
Write-Host "Registrations Inserted: $($stats.registrations)"
