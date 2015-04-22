var chai   = require('chai');
var should = chai.should(), expect = chai.expect;

var path        = require('path');
var Robot       = require('hubot/src/robot');
var TextMessage = require('hubot/src/message').TextMessage;

// The below to be refactored on a future turn

describe('deployQueue', function() {
    var robot;
    var user;
    var adapter;
    var brain;

    beforeEach(function(done) {
        // create new robot, without http, using the mock adapter
        robot = new Robot(null, 'mock-adapter', false, 'UatBot');

        robot.adapter.on('connected', function() {
            robot.loadFile(path.resolve('node_modules/hubot/src'));
            require('../scripts/deployQueue')(robot);

            user = robot.brain.userForId('1', {
                name: 'TestUser',
                room: '#testroom'
            });

            otherUser = robot.brain.userForId('2', {
                name: 'OtherTestUser',
                room: '#testroom'
            });

            someOtherUser = robot.brain.userForId('2', {
                name: 'SomeOtherTestUser',
                room: '#testroom'
            });

            adapter = robot.adapter;
            brain = robot.brain;
            done();
        });

        robot.run();
    });

    afterEach(function() {
        robot.shutdown();
    });


    describe('deploy schedule <application>', function() {
        it('retrieves an application name from a string and returns it in lower case', function(done) {
            adapter.on('send', function(envelope, strings) {
                expect(strings[0]).match(/alpaca/);
                done();
            });
            adapter.receive(new TextMessage(user, 'deploy schedule aLPaca'));
        });

        describe('When the application is not registered', function() {
            it('says it does not know the application', function(done) {
                adapter.on('send', function(envelope, strings) {
                    expect(strings[0]).match(/Application unregistered_application is not registered for deploy management/);
                    done();
                });
                adapter.receive(new TextMessage(user, 'deploy schedule unregistered_application'));
            });
        });

        describe('When user is first to deploy', function() {
            it('says the user is next to deploy', function(done) {
                adapter.on('send', function(envelope, strings) {
                    expect(strings[0]).match(/You are next to deploy alpaca./);
                    done();
                });
                adapter.receive(new TextMessage(user, 'deploy schedule alpaca'));
            });

            it('pushes the user into the application deployment queue', function(done) {
                adapter.receive(new TextMessage(user, 'deploy schedule alpaca'));
                expect(brain.get('deployQueue')['alpaca']).to.have.members(['TestUser']);
                done();
            });
        });

        describe('When user is not first to deploy', function() {
            beforeEach(function(done) {
                brain.set('deployQueue', {'alpaca': ['OtherTestUser']})
                done();
            });

            it('says the deploy was scheduled', function(done) {
                adapter.on('send', function(envelope, strings) {
                    expect(strings[0]).match(/Deploy scheduled for alpaca. Check status of queue./);
                    done();
                });
                adapter.receive(new TextMessage(user, 'deploy schedule alpaca'));
            });

            it('pushes the user into the application deployment queue', function(done) {
                adapter.receive(new TextMessage(user, 'deploy schedule alpaca'));
                expect(brain.get('deployQueue')['alpaca']).to.have.members(['OtherTestUser', 'TestUser']);
                done();
            });
        });
    });

    describe('deploy unschedule <application>', function() {
        it('retrieves an application name from a string and returns it in lower case', function(done) {
            adapter.on('send', function(envelope, strings) {
                expect(strings[0]).match(/alpaca/);
                done();
            });
            adapter.receive(new TextMessage(user, 'deploy unschedule aLPaca'));
        });

        describe('When the application is not registered', function() {
            it('says it does not know the application', function(done) {
                adapter.on('send', function(envelope, strings) {
                    expect(strings[0]).match(/Application unregistered_application is not registered for deploy management/);
                    done();
                });
                adapter.receive(new TextMessage(user, 'deploy unschedule unregistered_application'));
            });
        });

        describe('When user has no deploys scheduled for the application', function() {
            beforeEach(function(done) {
                brain.set('deployQueue', {'alpaca': ['OtherTestUser', 'SomeOtherTestUser']})
                done();
            });

            it('says the user has no deploys scheduled', function(done) {
                adapter.on('send', function(envelope, strings) {
                    expect(strings[0]).match(/You have no scheduled deploys for alpaca/);
                    done();
                });
                adapter.receive(new TextMessage(user, 'deploy unschedule alpaca'));
            });

            it('does not remove any user from the application deployment queue', function(done) {
                adapter.receive(new TextMessage(user, 'deploy unschedule alpaca'));
                expect(brain.get('deployQueue')['alpaca']).to.have.members(['OtherTestUser', 'SomeOtherTestUser']);
                done();
            });
        });

        describe('When user has a deploy scheduled', function() {
            beforeEach(function(done) {
                brain.set('deployQueue', {'alpaca': ['OtherTestUser', 'TestUser', 'SomeOtherTestUser']})
                done();
            });

            it('says the deploy was cancelled', function(done) {
                adapter.on('send', function(envelope, strings) {
                    expect(strings[0]).match(/Your scheduled deploy was cancelled for alpaca/);
                    done();
                });
                adapter.receive(new TextMessage(user, 'deploy unschedule alpaca'));
            });

            it('removes the user from the application deployment queue', function(done) {
                adapter.receive(new TextMessage(user, 'deploy unschedule alpaca'));
                expect(brain.get('deployQueue')['alpaca']).to.have.members(['OtherTestUser', 'SomeOtherTestUser']);
                done();
            });
        });
    });

    describe('deploy start <application>', function() {
        beforeEach(function(done) {
            brain.set('deployQueue', {'alpaca': ['TestUser', 'OtherTestUser', 'SomeOtherTestUser']})
            done();
        });

        it('retrieves an application name from a string and returns it in lower case', function(done) {
            adapter.on('send', function(envelope, strings) {
                expect(strings[0]).match(/alpaca/);
                done();
            });
            adapter.receive(new TextMessage(user, 'deploy start aLPaca'));
        });

        describe('When the application is not registered', function() {
            it('says it does not know the application', function(done) {
                adapter.on('send', function(envelope, strings) {
                    expect(strings[0]).match(/Application unregistered_application is not registered for deploy management/);
                    done();
                });
                adapter.receive(new TextMessage(user, 'deploy start unregistered_application'));
            });
        });

        describe('When there is an ongoing deploy', function() {
            beforeEach(function(done) {
                brain.set('onGoingDeploys', {'alpaca': 'OtherTestUser', 'bilcas': null});
                done();
            });

            it('says the user cannot start a deploy when there is an ongoing deploy', function(done) {
                adapter.on('send', function(envelope, strings) {
                    expect(strings[0]).match(/You cannot start a deploy when there is an ongoing deploy for alpaca by OtherTestUser/);
                    done();
                });
                adapter.receive(new TextMessage(user, 'deploy start alpaca'));
            });

            it('does not assign the user to the ongoing deploy', function(done) {
                adapter.receive(new TextMessage(user, 'deploy start alpaca'));
                expect(brain.get('onGoingDeploys')['alpaca']).to.equal('OtherTestUser');
                done();
            });

            it('does not change the application deployment queue', function(done) {
                adapter.receive(new TextMessage(user, 'deploy start alpaca'));
                expect(brain.get('deployQueue')['alpaca']).to.have.members(['TestUser', 'OtherTestUser', 'SomeOtherTestUser']);
                done();
            });
        });

        describe('When there is not any ongoing deploy', function() {
            describe('When the user is not the first in the queue', function(){
                beforeEach(function(done) {
                    brain.set('deployQueue', {'alpaca': ['OtherTestUser', 'TestUser', 'SomeOtherTestUser']})
                    done();
                });

                it('says the user cannot start a deploy when he is not the first in the queue', function(done) {
                    adapter.on('send', function(envelope, strings) {
                        expect(strings[0]).match(/You are not the first in the queue to deploy alpaca. Next to deploy is OtherTestUser/);
                        done();
                    });
                    adapter.receive(new TextMessage(user, 'deploy start alpaca'));
                });

                it('does not assign the user to the ongoing deploy', function(done) {
                    adapter.receive(new TextMessage(user, 'deploy start alpaca'));
                    expect(brain.get('onGoingDeploys')['alpaca']).to.equal(null);
                    done();
                });

                it('does not change the application deployment queue', function(done) {
                    adapter.receive(new TextMessage(user, 'deploy start alpaca'));
                    expect(brain.get('deployQueue')['alpaca']).to.have.members(['OtherTestUser', 'TestUser', 'SomeOtherTestUser']);
                    done();
                });
            });

            describe('When the user is first in the queue', function(){
                beforeEach(function(done) {
                    brain.set('deployQueue', {'alpaca': ['TestUser', 'OtherTestUser', 'SomeOtherTestUser']})
                    done();
                });

                it('says the user is now the active deploy user', function(done) {
                    adapter.on('send', function(envelope, strings) {
                        expect(strings[0]).match(/You are now the active deploy user for alpaca/);
                        done();
                    });
                    adapter.receive(new TextMessage(user, 'deploy start alpaca'));
                });

                it('assigns the user to the ongoing deploy', function(done) {
                    adapter.receive(new TextMessage(user, 'deploy start alpaca'));
                    expect(brain.get('onGoingDeploys')['alpaca']).to.equal('TestUser');
                    done();
                });

                it('removes the user from the application deployment queue', function(done) {
                    adapter.receive(new TextMessage(user, 'deploy start alpaca'));
                    expect(brain.get('deployQueue')['alpaca']).to.have.members(['OtherTestUser', 'SomeOtherTestUser']);
                    done();
                });
            });
        });
    });

    describe('deploy complete <application>', function() {
        beforeEach(function(done) {
            brain.set('deployQueue', {'alpaca': ['TestUser', 'OtherTestUser', 'SomeOtherTestUser']})
            done();
        });

        it('retrieves an application name from a string and returns it in lower case', function(done) {
            adapter.on('send', function(envelope, strings) {
                expect(strings[0]).match(/alpaca/);
                done();
            });
            adapter.receive(new TextMessage(user, 'deploy complete aLPaca'));
        });

        describe('When the application is not registered', function() {
            it('says it does not know the application', function(done) {
                adapter.on('send', function(envelope, strings) {
                    expect(strings[0]).match(/Application unregistered_application is not registered for deploy management/);
                    done();
                });
                adapter.receive(new TextMessage(user, 'deploy complete unregistered_application'));
            });
        });

        describe('When there is no ongoing deploy', function() {
            it('says there is no ongoing deploy for the application', function(done) {
                adapter.on('send', function(envelope, strings) {
                    expect(strings[0]).match(/There is no ongoing deploy for alpaca/);
                    done();
                });
                adapter.receive(new TextMessage(user, 'deploy complete alpaca'));
            });
        });

        describe('When the ongoing deploy was started by other user', function() {
            beforeEach(function(done) {
                brain.set('onGoingDeploys', {'alpaca': 'OtherTestUser', 'bilcas': null});
                done();
            });

            it('says it cannot complete a deploy started by other user', function(done) {
                adapter.on('send', function(envelope, strings) {
                    expect(strings[0]).match(/You cannot complete a deploy started by other user \(OtherTestUser\) for alpaca/);
                    done();
                });
                adapter.receive(new TextMessage(user, 'deploy complete alpaca'));
            });

            it('does not remove the ongoing deploy user for the application', function(done) {
                adapter.receive(new TextMessage(user, 'deploy complete alpaca'));
                expect(brain.get('onGoingDeploys')['alpaca']).to.equal('OtherTestUser');
                done();
            });
        });

        describe('When there is an ongoing deploy', function() {
            beforeEach(function(done) {
                brain.set('deployQueue', {'alpaca': ['OtherTestUser', 'SomeOtherTestUser']})
                brain.set('onGoingDeploys', {'alpaca': 'TestUser', 'bilcas': null});
                done();
            });

            it('says the deploy is complete for the application', function(done) {
                adapter.on('send', function(envelope, strings) {
                    expect(strings[0]).match(/Your deploy is now complete for alpaca. Next user to deploy: OtherTestUser/);
                    done();
                });
                adapter.receive(new TextMessage(user, 'deploy complete alpaca'));
            });

            it('unsets the user from the application ongoing deploy', function(done) {
                adapter.receive(new TextMessage(user, 'deploy complete alpaca'));
                expect(brain.get('onGoingDeploys')['alpaca']).to.equal(null);
                done();
            });
        });
    });

    describe('deploy cancel <application>', function() {
        beforeEach(function(done) {
            brain.set('deployQueue', {'alpaca': ['TestUser', 'OtherTestUser', 'SomeOtherTestUser']})
            done();
        });

        it('retrieves an application name from a string and returns it in lower case', function(done) {
            adapter.on('send', function(envelope, strings) {
                expect(strings[0]).match(/alpaca/);
                done();
            });
            adapter.receive(new TextMessage(user, 'deploy cancel aLPaca'));
        });

        describe('When the application is not registered', function() {
            it('says it does not know the application', function(done) {
                adapter.on('send', function(envelope, strings) {
                    expect(strings[0]).match(/Application unregistered_application is not registered for deploy management/);
                    done();
                });
                adapter.receive(new TextMessage(user, 'deploy cancel unregistered_application'));
            });
        });

        describe('When there is no ongoing deploy', function() {
            it('says there is no ongoing deploy for the application', function(done) {
                adapter.on('send', function(envelope, strings) {
                    expect(strings[0]).match(/There is no ongoing deploy for alpaca/);
                    done();
                });
                adapter.receive(new TextMessage(user, 'deploy cancel alpaca'));
            });
        });

        describe('When the ongoing deploy was started by other user', function() {
            beforeEach(function(done) {
                brain.set('onGoingDeploys', {'alpaca': 'OtherTestUser', 'bilcas': null});
                done();
            });

            it('says it cannot cancel a deploy started by other user', function(done) {
                adapter.on('send', function(envelope, strings) {
                    expect(strings[0]).match(/You cannot cancel a deploy started by other user \(OtherTestUser\) for alpaca/);
                    done();
                });
                adapter.receive(new TextMessage(user, 'deploy cancel alpaca'));
            });

            it('does not remove the ongoing deploy user for the application', function(done) {
                adapter.receive(new TextMessage(user, 'deploy cancel alpaca'));
                expect(brain.get('onGoingDeploys')['alpaca']).to.equal('OtherTestUser');
                done();
            });
        });

        describe('When there is an ongoing deploy', function() {
            beforeEach(function(done) {
                brain.set('deployQueue', {'alpaca': ['OtherTestUser', 'SomeOtherTestUser']})
                brain.set('onGoingDeploys', {'alpaca': 'TestUser', 'bilcas': null});
                done();
            });

            it('says the deploy is cancelled for the application', function(done) {
                adapter.on('send', function(envelope, strings) {
                    expect(strings[0]).match(/Your deploy is now cancelled for alpaca. Next user to deploy: OtherTestUser/);
                    done();
                });
                adapter.receive(new TextMessage(user, 'deploy cancel alpaca'));
            });

            it('unsets the user from the application ongoing deploy', function(done) {
                adapter.receive(new TextMessage(user, 'deploy cancel alpaca'));
                expect(brain.get('onGoingDeploys')['alpaca']).to.equal(null);
                done();
            });
        });
    });

    describe('deploy next <application>', function() {
        beforeEach(function(done) {
            brain.set('deployQueue', {'alpaca': ['OtherTestUser', 'TestUser', 'SomeOtherTestUser']})
            done();
        });

        it('retrieves an application name from a string and returns it in lower case', function(done) {
            adapter.on('send', function(envelope, strings) {
                expect(strings[0]).match(/alpaca/);
                done();
            });
            adapter.receive(new TextMessage(user, 'deploy next aLPaca'));
        });

        describe('When the application is not registered', function() {
            it('says it does not know the application', function(done) {
                adapter.on('send', function(envelope, strings) {
                    expect(strings[0]).match(/Application unregistered_application is not registered for deploy management/);
                    done();
                });
                adapter.receive(new TextMessage(user, 'deploy next unregistered_application'));
            });
        });

        describe('When there are no scheduled users to deploy', function() {
            beforeEach(function(done) {
                brain.set('deployQueue', {'alpaca': []});
                done();
            });

            it('says there are no scheduled users to deploy the application', function(done) {
                adapter.on('send', function(envelope, strings) {
                    expect(strings[0]).match(/There are no scheduled users to deploy/);
                    done();
                });
                adapter.receive(new TextMessage(user, 'deploy next alpaca'));
            });
        });

        it('says the next user to deploy the application', function(done) {
            adapter.on('send', function(envelope, strings) {
                expect(strings[0]).match(/Next user to deploy alpaca: OtherTestUser/);
                done();
            });
            adapter.receive(new TextMessage(user, 'deploy next alpaca'));
        });
    });

    describe('deploy status <application>', function() {
        beforeEach(function(done) {
            brain.set('deployQueue', {'alpaca': ['OtherTestUser', 'TestUser', 'SomeOtherTestUser']})
            brain.set('onGoingDeploys', {'alpaca': 'OtherTestUser', 'bilcas': null});
            done();
        });

        it('retrieves an application name from a string and returns it in lower case', function(done) {
            adapter.on('send', function(envelope, strings) {
                expect(strings[0]).match(/alpaca/);
                done();
            });
            adapter.receive(new TextMessage(user, 'deploy status aLPaca'));
        });

        describe('When the application is not registered', function() {
            it('says it does not know the application', function(done) {
                adapter.on('send', function(envelope, strings) {
                    expect(strings[0]).match(/Application unregistered_application is not registered for deploy management/);
                    done();
                });
                adapter.receive(new TextMessage(user, 'deploy status unregistered_application'));
            });
        });

        describe('When there are no scheduled users to the deploy the application', function(done) {
            beforeEach(function(done) {
                brain.set('deployQueue', {'alpaca': []});
                done();
            });

            it('says there are no scheduled users to deploy the application', function(done) {
                adapter.on('send', function(envelope, strings) {
                    expect(strings[0]).match(/There are no scheduled users to deploy alpaca/);
                    done();
                });
                adapter.receive(new TextMessage(user, 'deploy status alpaca'));
            });
        });

        describe('When there is no ongoing deploy for the application', function(done) {
            beforeEach(function(done) {
                brain.set('onGoingDeploys', {'alpaca': null, 'bilcas': 'SomeOtherUser'});
                done();
            });

            it('says there is no ongoing deploy for the application', function(done) {
                adapter.on('send', function(envelope, strings) {
                    expect(strings[0]).match(/There is no ongoing deploy for alpaca/);
                    done();
                });
                adapter.receive(new TextMessage(user, 'deploy status alpaca'));
            });
        });

        it('says the scheduled user to deploy the application', function(done) {
            adapter.on('send', function(envelope, strings) {
                expect(strings[0]).match(/Scheduled users to deploy for alpaca:\nOtherTestUser\nTestUser\nSomeOtherTestUser/);
                done();
            });
            adapter.receive(new TextMessage(user, 'deploy status alpaca'));
        });

        it('says the ongoing deploy user', function(done) {
            adapter.on('send', function(envelope, strings) {
                expect(strings[0]).match(/Ongoing deploy started by OtherTestUser for alpaca/);
                done();
            });
            adapter.receive(new TextMessage(user, 'deploy status alpaca'));
        });
    });
});

