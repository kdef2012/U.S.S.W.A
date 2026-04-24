$ErrorActionPreference = 'Stop'

$csvPath = "c:\Users\kdnelson\OneDrive - Winston-Salem Forsyth County Schools\Desktop\cougar-clash-export.csv"

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

$csvContent = $lines[$headerIdx..($lines.Count-1)] | Out-String
$data = $csvContent | ConvertFrom-Csv

$env = Get-Content .env.local | ConvertFrom-StringData
$url = $env.NEXT_PUBLIC_SUPABASE_URL
$key = $env.NEXT_PUBLIC_SUPABASE_ANON_KEY
$eventId = "ae7bfba2-60f9-45da-92dc-5dbeb06df3de"

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

Write-Host "Starting migration of $($data.Count) rows..."

foreach ($row in $data) {
    $email = $row.'E-mail'
    if ([string]::IsNullOrWhiteSpace($email)) { continue }

    $first = $row.'First Name'
    $last = $row.'Last Name'
    $phone = $row.'Phone Number'
    $spaces = [int]($row.'Ticket Spaces')
    $fee = [decimal]($row.'Ticket Total'.Replace('$',''))

    $wrestlerFirst = $row.'Attendee Wrestler First Name'
    $wrestlerLast = $row.'Attendee Wrestlers Last Name'
    $division = $row.'Attendee Division'
    $weightClass = $row.'Attendee Weight Class'
    $team = $row.'Attendee Team'

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
    if ($wrestlerFirst -eq 'Multiple Attendees') {
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

Write-Host "Migration Complete!"
Write-Host "Parents Inserted: $($stats.parents)"
Write-Host "Wrestlers Inserted: $($stats.wrestlers)"
Write-Host "Registrations Inserted: $($stats.registrations)"
