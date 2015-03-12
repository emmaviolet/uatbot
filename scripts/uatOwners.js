// Description:
// uatOwners manages the allocation of UATs between team members.

// Commands:
// uat grab <uat>     - allocates the user to the UAT if the UAT is available
// uat release <uat>  - removes the user from the UAT
// uat steal <uat>    - allocates the user to the UAT even if the UAT is not available
// uat status <uat>   - returns the UAT name and the name of the person currrently allocated to it; multiple UAT names can be separated by commas or spaces
// uat status all     - returns the status of all known UATs

// Author:
// @emmaviolet

module.exports = function(robot) {
  var uatOwners;
  var uatNames = [
    'astroboy', 'derbystallion', 'donkeykong', 'doubledragon', 'galaga',
    'ghostbusters', 'goldeneye', 'kirby', 'mariogolf', 'metroid', 'mickeymania',
    'mortalkombat', 'pikmin', 'quake', 'starfox', 'yoshi', 'zelda'
  ];

  function arrayToHash(array) {
    var hash = {};
    for (var i = 0; i < array.length; i ++) {
      hash[array[i]] = '';
    };
    return hash;
  };

  function getUatOwners() {
    var owners = robot.brain.get('uatOwners');
    if(!owners) { robot.brain.set('uatOwners', arrayToHash(uatNames)) };
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

  robot.hear(/uat status ([\w\s,]+)/, function(msg) {
    uatOwners = getUatOwners();
    var uatList = '';

    if (msg.match[1] === 'all') { uatQueries = uatNames }
    else { uatQueries = msg.match[1].split(/[ ,]+/) }

    for (var i in uatQueries) {
      uat = uatQueries[i].toLowerCase();
      uatList += uat + ': ' + uatOwners[uat] + '\n';
    };
    msg.send(uatList);
  });
}
