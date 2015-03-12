module.exports = function(robot) {
  var uatNames = {
    'Astroboy': '',
    'Derbystallion': '',
    'Donkeykong': '',
    'Doubledragon': '',
    'Galaga': '',
    'Ghostbusters': '',
    'Goldeneye': '',
    'Kirby': '',
    'Mariogolf': '',
    'Metroid': '',
    'Mickeymania': '',
    'Mortalkombat': '',
    'Pikmin': '',
    'Quake': '',
    'Starfox': '',
    'Yoshi': '',
    'Zelda': ''
  }

  function getUatOwners() {
    owners = robot.brain.get('uatOwners');
    if(!owners) { robot.brain.set('uatOwners', uatNames) };
    return robot.brain.get('uatOwners');
  }

  function toTitleCase(str) {
    return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
  };

  function uatName(msg) { return toTitleCase(msg.match[1]) };

  function uatFree() { return uat in uatOwners && uatOwners[uat] == '' };
  function uatOwnedByUser() { return uat in uatOwners && uatOwners[uat] == userName };

  function assignVariables(msg) {
    uat = uatName(msg);
    userName = msg.envelope.user.name;
    uatOwners = getUatOwners();
  };

  robot.hear(/uat grab (.*)/, function(msg) {
    assignVariables(msg);
    if(uatFree()) {
      uatOwners[uat] = userName;
      msg.send(userName + ' has grabbed ' + uat);
    } else if(uatOwnedByUser()) {
      msg.send('You already have ' + uat + ', ' + userName);
    } else if(uat in uatOwners) {
      msg.send(uatOwners[uat] + ' already has ' + uat);
    } else {
      msg.send(uat + ' is not a UAT');
    }
  });

  robot.hear(/uat release (.*)/, function(msg) {
    assignVariables(msg);
    if(uatFree()) {
      msg.send(uat + ' is not currently in use')
    } else if(uatOwnedByUser()) {
      uatOwners[uat] = '';
      msg.send(userName + ' has released ' + uat);
    } else if(uat in uatOwners) {
      msg.send(uatOwners[uat] + ' currently has ' + uat);
    } else {
      msg.send(uat + ' is not a UAT');
    }
  });

  robot.hear(/uat steal (.*)/, function(msg) {
    assignVariables(msg);
    if(uat in uatOwners) {
      uatOwners[uat] = userName;
      msg.send(userName + ' has stolen ' + uat);
    } else {
      msg.send(uat + ' is not a UAT');
    }
  });

  robot.hear(/uat status (.*)/, function(msg) {
    uatOwners = getUatOwners();
    uatList = '';

    if(msg.match[1] == 'all') {
      uatQueries = Object.keys(uatOwners);
    } else {
      uatQueries = msg.match[1].split(/[ ,]+/);
    }

    for(var i in uatQueries) {
      uat = toTitleCase(uatQueries[i]);
      uatList += uat + ': ' + uatOwners[uat] + '\n';
    };
    msg.send(uatList);
  });
}
