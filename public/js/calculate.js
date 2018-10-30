function calculate() {
  const wpm = parseInt(
    $('#WPM')
      .val()
      .replace(/,/g, ''),
    10
  )
  const words = parseInt(
    $('#Wordcount')
      .html()
      .replace(/,/g, ''),
    10
  )
  const mins = words / wpm
  const esthr = Math.floor(mins / 60)
  const estmin = Math.floor(mins - esthr * 60)
  const month = Math.floor(mins / 30)

  $('#estHr').html(esthr)
  $('#estMin').html(estmin)
  $('#month').html(month)
  $('#results').removeClass('hidden')
}

function readtime() {
  let b
  let T0 = ''
  if (
    $('#timing').html() === 'Start reading' ||
    $('#timing').html() === 'Test again'
  ) {
    b = new Date()
    T0 = b.getTime()
    $('#timing').html('Timing...')
  } else if ($('#timing').html() === 'Timing...') {
    $('#timing').html('Test again')
    const a = new Date()
    const T1 = a.getTime()
    const elapsed = T1 - T0
    const minutes = elapsed / 60000
    let description = $('#description').html()
    description = description.replace(/<[^>]*>/g, ' ')
    description = description.replace(/\s+/g, ' ')
    description = description.trim()
    const words = description.split(' ').length
    const WPM = Math.round(words / minutes)
    $('#WPMResult').html(WPM)
    $('#CalcWPM').removeClass('hidden')
    $('#WPM').val(WPM)
    calculate()
  }
}

export { readtime }
export { calculate }
