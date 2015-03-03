module.exports = (robot) ->

  uatOwners = {'Goldeneye': '', 'Donkeykong': '', 'Starfox': ''}
  toTitleCase = (str) -> str[0].toUpperCase() + str[1..str.length - 1].toLowerCase()

  robot.respond /uat grab (.*)/i, (msg) ->
    uat = toTitleCase(msg.match[1])
    userName = msg.envelope.user.name
    if uat of uatOwners and uatOwners[uat] == ''
      uatOwners[uat] = userName
      msg.send "#{userName} has taken #{uat}"
    else if uat of uatOwners and uatOwners[uat] == userName
      msg.send "You already have #{uat}, #{userName}"
    else if uat of uatOwners
      msg.send "#{uatOwners[uat]} already has #{uat}"
    else
      msg.send "#{uat} is not a UAT"

  robot.respond /uat release (.*)/i, (msg) ->
    uat = toTitleCase(msg.match[1])
    userName = msg.envelope.user.name
    if uat of uatOwners and uatOwners[uat] == userName
      uatOwners[uat] = ''
      msg.send "#{userName} has released #{uat}"
    else if uat of uatOwners and uatOwners[uat] == ''
      msg.send "#{uat} is not currently in use"
    else if uat of uatOwners
      msg.send "#{uatOwners[uat]} currently has #{uat}"
    else
      msg.send "#{uat} is not a UAT"

  robot.respond /uat status/i, (msg) ->
    for key, value of uatOwners
      msg.send "#{key}: #{value}"
