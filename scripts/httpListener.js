/**
* @author @emmaviolet
*/

module.exports = function(robot) {

  function getPulls() {
    if(!robot.brain.get('pullRequests')) { robot.brain.set('pullRequests', []) };
    return robot.brain.get('pullRequests');
  };

  robot.router.post('/pulls', function(request, response) {
    var pullRequests = getPulls();
    data = JSON.parse(request);
    pullRequests.push(data);

    response.send('OK');
  });

  robot.hear(/pull requests/, function(msg) {
    var pullRequests = getPulls();
    msg.emote('Pull Requests:\n' + pullRequests);
  });

}