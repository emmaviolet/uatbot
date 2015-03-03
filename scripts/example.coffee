module.exports = (robot) ->

  userName = 'Emma'
  uatOwners = {'Goldeneye': '', 'Donkeykong': '', 'Starfox': ''}

  toTitleCase = (str) -> str[0].toUpperCase() + str[1..str.length - 1].toLowerCase()

  robot.respond /uat grab (.*)/i, (msg) ->
    uat = toTitleCase(msg.match[1])
    if uat of uatOwners and uatOwners[uat] == ''
      uatOwners[uat] = userName
      msg.reply "#{userName} has taken #{uat}"
    else if uat of uatOwners and uatOwners[uat] == userName
      msg.reply "You already have #{uat}, #{userName}"
    else if uat of uatOwners
      msg.reply "#{uatOwners[uat]} already has #{uat}"
    else
      msg.reply "#{uat} is not a UAT"

  robot.respond /uat release (.*)/i, (msg) ->
    uat = toTitleCase(msg.match[1])
    if uat of uatOwners and uatOwners[uat] == userName
      uatOwners[uat] = ''
      msg.reply "#{userName} has released #{uat}"
    else if uat of uatOwners and uatOwners[uat] == ''
      msg.reply "#{uat} is not currently in use"
    else if uat of uatOwners
      msg.reply "#{uatOwners[uat]} currently has #{uat}"
    else
      msg.reply "#{uat} is not a UAT"

  robot.respond /uat status/i, (msg) ->
    for key, value of uatOwners
      msg.reply "#{key}: #{value}"
