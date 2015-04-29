module.exports = function(robot) {

  robot.adapter.emote = function(envelope, messages) {
    var decoratedMessage = messages.trim().split("\n").map(function(message) {
      return '(android) ' + message;
    }).join("\n");
    this.send(envelope, decoratedMessage);
  };

};
