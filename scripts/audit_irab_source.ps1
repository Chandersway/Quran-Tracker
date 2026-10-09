$ErrorActionPreference = 'Stop'
# Small live sample only. Does not download or redistribute the book.
$samples = @('1/1','1/7','2/1','2/2','2/254','2/255','2/256','2/282','18/1','36/1','112/1','114/6')
foreach ($sample in $samples) {
    $url = "https://api.quranpedia.net/v1/ayah/$sample/book/316"
    $result = Invoke-RestMethod -Uri $url -TimeoutSec 20
    $blocks = @($result.content)
    [pscustomobject]@{
        reference = $sample.Replace('/', ':')
        book = $result.book.id
        blocks = $blocks.Count
        pages = ($blocks.page -join ',')
        rawAyahs = ($blocks.ayahs -join ';')
        characters = ($blocks | ForEach-Object { $_.text.Length } | Measure-Object -Sum).Sum
        headings = (($blocks | ForEach-Object {
            [regex]::Matches($_.text, '\[سورة[^\]]+\]') | ForEach-Object { $_.Value }
        }) -join ' | ')
    } | ConvertTo-Json -Compress
}
