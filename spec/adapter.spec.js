var chai = require('chai');
var sinon = require('sinon');
var should = chai.should(), expect = chai.expect;

var path        = require('path');
var Robot       = require('hubot/src/robot');
var TextMessage = require('hubot/src/message').TextMessage;

describe('adapter', function() {
    var adapter, brain, robot, spy, user;

    beforeEach(function(done) {
        // create new robot, without http, using the mock adapter
        robot = new Robot(null, 'mock-adapter', false, 'UatBot');

        robot.adapter.on('connected', function() {
            robot.loadFile(path.resolve('node_modules/hubot/src'));
            require('../scripts/adapter')(robot);


            user = robot.brain.userForId('1', {
                name: 'TestUser',
                room: '#testroom'
            });

            adapter = robot.adapter;
            spy = sinon.spy(adapter, 'send');
            brain = robot.brain;
            done();
        });

        robot.hear(/test/, function(msg) {
            msg.emote("line1\nline2");
        });

        robot.hear(/test-trailing-newline/, function(msg) {
            msg.emote("line1\n");
        });

        robot.run();
    });
    afterEach(function() {
        spy.should.have.been.called;
        robot.shutdown();
    });

    it('decorates each line with a HipChat emoji', function(done) {
        adapter.on('send', function(envelope, strings) {
            expect(strings).match(/^\(android\) line1/)
            expect(strings).match(/\n\(android\) line2/)
            done();
        });
        adapter.receive(new TextMessage(user, 'test'));
    });

    it('removes trailing empty line', function(done) {
        adapter.on('send', function(envelope, strings) {
            expect(strings).match(/^\(android\) line1/)
            expect(strings).not.match(/\n\(android\) $/)
            done();
        });
        adapter.receive(new TextMessage(user, 'test-trailing-newline'));
    });
});
