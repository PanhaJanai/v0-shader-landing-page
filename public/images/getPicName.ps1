$names = Get-ChildItem -File | ForEach-Object {
    $fileName = $_.Name
    $baseName, $extension = $fileName -split '\.(?=[^\.]+$)' # Split into base name and extension
    $formattedName = $baseName -join ' '
    "'$formattedName.$extension'" # Wrap the name in quotes
}

# Output the array
Write-Output @($names -join ", ")
