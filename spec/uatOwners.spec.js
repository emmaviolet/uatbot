var chai = require('chai');
var should = chai.should(), expect = chai.expect;

var path   = require('path');
var Robot       = require('hubot/src/robot');
var TextMessage = require('hubot/src/message').TextMessage;

// The below to be refactored on a future turn

describe('UatBot', function() {
    var robot;
    var user;
    var adapter;
    var brain;

    beforeEach(function(done) {
        // create new robot, without http, using the mock adapter
        robot = new Robot(null, 'mock-adapter', false, 'UatBot');

        robot.adapter.on('connected', function() {
            robot.loadFile(path.resolve('node_modules/hubot/src'));
            require('../scripts/uatOwners')(robot);

            user = robot.brain.userForId('1', {
                name: 'TestUser',
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

    it('retrieves a UAT name from a string and returns it in lower case', function(done) {
        adapter.on('send', function(envelope, strings) {
            expect(strings[0]).match(/goldeneye/);
            done();
        });
        adapter.receive(new TextMessage(user, 'uat grab goLDENEye'));
    });

    describe('uat grab <uat>', function() {

        describe('When the UAT exists', function() {
            describe('and the UAT is free', function() {
                it('says the user has taken the UAT', function(done) {
                    adapter.on('send', function(envelope, strings) {
                        expect(strings[0]).match(/TestUser has grabbed goldeneye/);
                        done();
                    });
                    adapter.receive(new TextMessage(user, 'uat grab goldeneye'));
                });

                it('assigns the user to the UAT', function(done) {
                    adapter.receive(new TextMessage(user, 'uat grab goldeneye'));
                    expect(brain.get('uatOwners')['goldeneye']).to.equal('TestUser');
                    done();
                });
            });

            describe('and the user already has the UAT', function() {
                beforeEach(function(done) {
                    brain.set('uatOwners', {'goldeneye': 'TestUser', 'donkeykong': '', 'starfox': ''})
                    done();
                });

                it('says the user already has the UAT', function(done) {
                    adapter.on('send', function(envelope, strings) {
                        expect(strings[0]).match(/You already have goldeneye, TestUser/);
                        done();
                    });
                    adapter.receive(new TextMessage(user, 'uat grab goldeneye'));
                });

                it('does not change the UAT assignment', function(done) {
                    adapter.receive(new TextMessage(user, 'uat grab goldeneye'));
                    expect(brain.get('uatOwners')['goldeneye']).to.equal('TestUser');
                    done();
                });
            });

            describe('and another user has the UAT', function() {
                beforeEach(function(done) {
                    brain.set('uatOwners', {'goldeneye': 'AnotherUser', 'donkeykong': '', 'starfox': ''})
                    done();
                });

                it('tells the user who has the UAT', function(done) {
                    adapter.on('send', function(envelope, strings) {
                        expect(strings[0]).match(/AnotherUser already has goldeneye/);
                        done();
                    });
                    adapter.receive(new TextMessage(user, 'uat grab goldeneye'));
                });

                it('does not change the UAT assignment', function(done) {
                    adapter.receive(new TextMessage(user, 'uat grab goldeneye'));
                    expect(brain.get('uatOwners')['goldeneye']).to.equal('AnotherUser');
                    done();
                });
            });
        });

        describe('When the UAT is not registered', function() {
            it('says it does not know the UAT', function(done) {
                adapter.on('send', function(envelope, strings) {
                    expect(strings[0]).match(/I don't know anything about not-a-uat/);
                    done();
                });
                adapter.receive(new TextMessage(user, 'uat grab not-a-uat'));
            });
        });
    });

    describe('uat release <uat>', function() {

        describe('When the UAT exists', function() {
            describe('and the UAT is free', function() {
                it('says the UAT is not in use', function(done) {
                    adapter.on('send', function(envelope, strings) {
                        expect(strings[0]).match(/starfox is not currently in use/);
                        done();
                    });
                    adapter.receive(new TextMessage(user, 'uat release starfox'));
                });

                it('does not change the UAT assignment', function(done) {
                    adapter.receive(new TextMessage(user, 'uat release starfox'));
                    expect(brain.get('uatOwners')['starfox']).to.equal('');
                    done();
                });
            });

            describe('and the user has the UAT', function() {
                beforeEach(function(done) {
                    brain.set('uatOwners', {'goldeneye': '', 'donkeykong': '', 'starfox': 'TestUser'})
                    done();
                });

                it('says the user has released the UAT', function(done) {
                    adapter.on('send', function(envelope, strings) {
                        expect(strings[0]).match(/TestUser has released starfox/);
                        done();
                    });
                    adapter.receive(new TextMessage(user, 'uat release starfox'));
                });

                it('removes the user from the UAT', function(done) {
                    adapter.receive(new TextMessage(user, 'uat release starfox'));
                    expect(brain.get('uatOwners')['starfox']).to.equal('');
                    done();
                });
            });

            describe('and another user has the UAT', function() {
                beforeEach(function(done) {
                    brain.set('uatOwners', {'goldeneye': '', 'donkeykong': '', 'starfox': 'AnotherUser'})
                    done();
                });

                it('tells the user who has the UAT', function(done) {
                    adapter.on('send', function(envelope, strings) {
                        expect(strings[0]).match(/AnotherUser currently has starfox/);
                        done();
                    });
                    adapter.receive(new TextMessage(user, 'uat release starfox'));
                });

                it('does not change the UAT assignment', function(done) {
                    adapter.receive(new TextMessage(user, 'uat release starfox'));
                    expect(brain.get('uatOwners')['starfox']).to.equal('AnotherUser');
                    done();
                });
            });
        });

        describe('When the UAT is not registered', function() {
            it('says it does not know the UAT', function(done) {
                adapter.on('send', function(envelope, strings) {
                    expect(strings[0]).match(/I don't know anything about not-a-uat/);
                    done();
                });
                adapter.receive(new TextMessage(user, 'uat release not-a-uat'));
            });
        });
    });

    describe('uat steal <uat>', function() {

        describe('When the UAT exists', function() {
            beforeEach(function(done) {
                brain.set('uatOwners', {'goldeneye': '', 'donkeykong': '', 'starfox': 'AnotherUser'})
                done();
            });

            it('says the user has stolen the UAT', function(done) {
                adapter.on('send', function(envelope, strings) {
                    expect(strings[0]).match(/TestUser has stolen starfox/);
                    done();
                });
                adapter.receive(new TextMessage(user, 'uat steal starfox'));
            });

            it('assigns the user to the UAT', function(done) {
                adapter.receive(new TextMessage(user, 'uat steal starfox'));
                expect(brain.get('uatOwners')['starfox']).to.equal('TestUser');
                done();
            });
        });

        describe('When the UAT is not registered', function() {
            it('says it does not know the UAT', function(done) {
                adapter.on('send', function(envelope, strings) {
                    expect(strings[0]).match(/I don't know anything about not-a-uat/);
                    done();
                });
                adapter.receive(new TextMessage(user, 'uat steal not-a-uat'));
            });
        });
    });

    describe('uat status', function() {
        beforeEach(function(done) {
            brain.set('uatOwners', {'goldeneye': 'Test1', 'donkeykong': 'Test2', 'starfox': 'Test3'})
            done();
        });

        describe('uat status all', function() {
            it('lists all the UATs and their owners', function(done) {
                adapter.on('send', function(envelope, strings) {
                    expect(strings[0]).match(/goldeneye: Test1\ndonkeykong: Test2\nstarfox: Test3/);
                    done();
                });
                adapter.receive(new TextMessage(user, 'uat status all'));
                done();
            });
        })

        describe('uat status <uat>', function() {
            it('lists the given UATs and their owners', function(done) {
                adapter.on('send', function(envelope, strings) {
                    expect(strings[0]).match(/goldeneye: Test1\nstarfox: Test3/);
                    done();
                });
                adapter.receive(new TextMessage(user, 'uat status goldeneye starfox'));
                done();
            });

            it('strips out commas and white space', function(done) {
                adapter.on('send', function(envelope, strings) {
                    expect(strings[0]).match(/starfox: Test3\ndonkeykong: Test2/);
                    done();
                });
                adapter.receive(new TextMessage(user, 'uat status starfox, donkeykong'));
                done();
            })
        })
    });
});

