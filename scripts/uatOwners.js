// Description:
// uatOwners manages the allocation of UATs between team members.

// Commands:
// uat grab <uat>     - allocates the user to the UAT if the UAT is available
// uat release <uat>  - removes the user from the UAT
// uat steal <uat>    - allocates the user to the UAT even if the UAT is not available
// uat status         - returns all the default UAT names and the name of the person currrently allocated to them; if no default UATs are registered it lists the status of all known UATs
// uat status <uat>   - returns the status of all listed UATs; multiple UAT names can be separated by commas or spaces
// uat status all     - returns the status of all known UATs
// uat default <uat>  - sets default UATs for the room (for use with `uat status`); multiple default UATs can be set, separated by commas or spaces

// Author:
// @emmaviolet

module.exports = function(robot) {
  var roomSettings;
  var uatOwners;
  var uatNames = [
    'astroboy', 'derbystallion', 'donkeykong', 'doubledragon', 'galaga', 'ghostbusters',
    'goldeneye', 'iceclimber', 'kirby', 'mariogolf', 'metroid', 'mickeymania', 'mortalkombat',
    'pikmin', 'quake', 'starfox', 'streetfighter', 'yoshi', 'zelda'
  ];

  function arrayToHash(array) {
    var hash = {};
    for (var i = 0; i < array.length; i ++) {
      hash[array[i]] = '';
    };
    return hash;
  };

  function getRoomSettings() {
    if(!robot.brain.get('roomSettings')) { robot.brain.set('roomSettings', {}) }
    return robot.brain.get('roomSettings');
  };

  function getUatOwners() {
    if(!robot.brain.get('uatOwners')) { robot.brain.set('uatOwners', arrayToHash(uatNames)) };
    return robot.brain.get('uatOwners');
  };

  function uatName(msg) { return (msg.match[1]).toLowerCase() };
  function uatFree(uat) { return uat in uatOwners && uatOwners[uat] === '' };
  function uatOwnedByUser(uat, user) { return uat in uatOwners && uatOwners[uat] === user };

  robot.hear(/uat grab (\w+)/, function(msg) {
    uatOwners = getUatOwners();
    var uat = uatName(msg);
    var user = msg.envelope.user.name;
    if (uatFree(uat)) {
      uatOwners[uat] = user;
      msg.send(user + ' has grabbed ' + uat);
    } else if (uatOwnedByUser(uat, user)) {
      msg.send('You already have ' + uat + ', ' + user);
    } else if (uat in uatOwners) {
      msg.send(uatOwners[uat] + ' already has ' + uat);
    } else {
      msg.send('I don\'t know anything about ' + uat);
    }
  });

  robot.hear(/uat release (\w+)/, function(msg) {
    uatOwners = getUatOwners();
    var uat = uatName(msg);
    var user = msg.envelope.user.name;
    if (uatFree(uat)) {
      msg.send(uat + ' is not currently in use')
    } else if(uatOwnedByUser(uat, user)) {
      uatOwners[uat] = '';
      msg.send(user + ' has released ' + uat);
    } else if (uat in uatOwners) {
      msg.send(uatOwners[uat] + ' currently has ' + uat);
    } else {
      msg.send('I don\'t know anything about ' + uat);
    }
  });

  robot.hear(/uat steal (\w+)/, function(msg) {
    uatOwners = getUatOwners();
    var uat = uatName(msg);
    var user = msg.envelope.user.name;
    if (uat in uatOwners) {
      uatOwners[uat] = user;
      msg.send(user + ' has stolen ' + uat);
    } else {
      msg.send('I don\'t know anything about ' + uat);
    }
  });

  robot.hear(/uat status([\w\s,]+)/, function(msg) {
    uatOwners = getUatOwners();
    var room = msg.envelope.user.room;
    var roomSettings = getRoomSettings();
    var uatList = '';

    if (msg.match[1] === ' all') { var uatQueries = uatNames }
    else { var uatQueries = msg.match[1].split(/[ ,]+/) }

    for (var i in uatQueries) {
      uat = uatQueries[i].toLowerCase();
      if (uat in uatOwners) {
        uatList += uat + ': ' + uatOwners[uat] + '\n';
      };
    };
    if (uatList == '') { msg.send('I don\'t know anything about those UATs')}
    else { msg.send(uatList) }
  });

  robot.hear(/uat default ([\w\s,]+)/, function(msg) {
    roomSettings = getRoomSettings();
    var room = msg.envelope.user.room;
    var uatMessage = 'Default UATs for ' + room + ' are now:';

    if (msg.match[1] === 'all') { uats = uatNames }
    else { uats = msg.match[1].split(/[ ,]+/) }

    if (roomSettings[room]) {
      roomSettings[room]['uat'] = uats;
    } else {
      roomSettings[room] = { 'uat': uats };
    }

    for (var i in roomSettings[room]['uat']) {
      uat = roomSettings[room]['uat'][i].toLowerCase();
      uatMessage += ' ' + uat;
    };
    msg.send(uatMessage);
  });

}
