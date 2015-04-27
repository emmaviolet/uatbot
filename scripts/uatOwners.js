/**
* @description uatOwners manages the allocation of UATs between team members.
*
* @command uat grab <uat>     - allocates the user to the UAT if the UAT is available
* @command uat release <uat>  - removes the user from the UAT
* @command uat steal <uat>    - allocates the user to the UAT even if the UAT is not available
* @command uat status         - returns all the default UAT names and the name of the person currrently allocated to them
* @command uat status <uat>   - returns the status of all listed UATs; multiple UAT names can be separated by commas or spaces
* @command uat status all     - returns the status of all known UATs
* @command uat default <uat>  - sets default UATs for the room (for use with `uat status`); multiple default UATs can be set, separated by commas or spaces
*
* @author @emmaviolet
*/

module.exports = function(robot) {
  var comments = require('parse-comments'), fs = require('fs');
  var roomSettings, uatOwners;
  var uatNames = [
    'astroboy', 'derbystallion', 'donkeykong', 'doubledragon', 'galaga', 'ghostbusters',
    'goldeneye', 'iceclimber', 'kirby', 'mariogolf', 'metroid', 'mickeymania', 'mortalkombat',
    'pikmin', 'quake', 'starfox', 'streetfighter', 'yoshi', 'zelda'
  ];

  function arrayToHash(array) {
    var hash = {};
    for (var i = 0; i < array.length; i ++) { hash[array[i]] = ''; };
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

  robot.hear(/uat help/, function(msg) {
    var file = fs.readFileSync('scripts/uatOwners.js', 'utf8');
    var commands = comments(file)[0].command;
    msg.send(commands.join('\n'));
  });

  robot.hear(/uat grab (\w+)/, function(msg) {
    uatOwners = getUatOwners();
    var uat = uatName(msg);
    var user = msg.envelope.user.name;

    if (uatFree(uat)) {
      uatOwners[uat] = user;
      msg.emote(user + ' has grabbed ' + uat);
    }
    else if (uatOwnedByUser(uat, user)) { msg.emote('You already have ' + uat + ', ' + user); }
    else if (uat in uatOwners) { msg.emote(uatOwners[uat] + ' already has ' + uat); }
    else { msg.emote('I don\'t know anything about ' + uat); }
  });

  robot.hear(/uat release (\w+)/, function(msg) {
    uatOwners = getUatOwners();
    var uat = uatName(msg);
    var user = msg.envelope.user.name;

    if (uatFree(uat)) { msg.emote(uat + ' is not currently in use'); }
    else if(uatOwnedByUser(uat, user)) {
      uatOwners[uat] = '';
      msg.emote(user + ' has released ' + uat);
    }
    else if (uat in uatOwners) { msg.emote(uatOwners[uat] + ' currently has ' + uat); }
    else { msg.emote('I don\'t know anything about ' + uat); }
  });

  robot.hear(/uat steal (\w+)/, function(msg) {
    uatOwners = getUatOwners();
    var uat = uatName(msg);
    var user = msg.envelope.user.name;

    if (uat in uatOwners) {
      uatOwners[uat] = user;
      msg.emote(user + ' has stolen ' + uat);
    }
    else { msg.emote('I don\'t know anything about ' + uat); }
  });

  robot.hear(/uat status([\w\s,]*)/, function(msg) {
    uatOwners = getUatOwners();
    roomSettings = getRoomSettings();
    var room = msg.envelope.user.room;
    var uatList = '';

    if (msg.match[1] === ' all') { var uatQueries = uatNames }
    else if (msg.match[1] === '') {
      var uatQueries = (roomSettings[room] && roomSettings[room]['uat']) || uatNames
    }
    else { var uatQueries = msg.match[1].split(/[ ,]+/) }

    for (var i in uatQueries) {
      uat = uatQueries[i].toLowerCase();
      if (uat in uatOwners) { uatList += uat + ': ' + uatOwners[uat] + '\n'; }
    };

    if (uatList == '') { msg.emote('I don\'t know anything about those UATs')}
    else { msg.emote(uatList) }
  });

  robot.hear(/uat default ([\w\s,]+)/, function(msg) {
    roomSettings = getRoomSettings();
    var room = msg.envelope.user.room;
    var uatMessage = 'Default UATs for ' + room + ' are now:';

    if (msg.match[1] === 'all') { uats = uatNames }
    else { uats = msg.match[1].split(/[ ,]+/) }

    if (roomSettings[room]) { roomSettings[room]['uat'] = uats; }
    else { roomSettings[room] = { 'uat': uats }; }

    for (var i in roomSettings[room]['uat']) {
      uat = roomSettings[room]['uat'][i].toLowerCase();
      uatMessage += ' ' + uat;
    };

    msg.emote(uatMessage);
  });

}
