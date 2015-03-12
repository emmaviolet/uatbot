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

    it('retrieves a UAT name from a string and returns it in title case', function(done) {
        adapter.on('send', function(envelope, strings) {
            expect(strings[0]).match(/Goldeneye/);
            done();
        });
        adapter.receive(new TextMessage(user, 'uat grab goLDENEye'));
    });

    describe('uat grab <uat>', function() {

        describe('When the UAT exists', function() {
            describe('and the UAT is free', function() {
                it('says the user has taken the UAT', function(done) {
                    adapter.on('send', function(envelope, strings) {
                        expect(strings[0]).match(/TestUser has grabbed Goldeneye/);
                        done();
                    });
                    adapter.receive(new TextMessage(user, 'uat grab Goldeneye'));
                });

                it('assigns the user to the UAT', function(done) {
                    adapter.receive(new TextMessage(user, 'uat grab Goldeneye'));
                    expect(brain.get('uatOwners')['Goldeneye']).to.equal('TestUser');
                    done();
                });
            });

            describe('and the user already has the UAT', function() {
                beforeEach(function(done) {
                    brain.set('uatOwners', {'Goldeneye': 'TestUser', 'Donkeykong': '', 'Starfox': ''})
                    done();
                });

                it('says the user already has the UAT', function(done) {
                    adapter.on('send', function(envelope, strings) {
                        expect(strings[0]).match(/You already have Goldeneye, TestUser/);
                        done();
                    });
                    adapter.receive(new TextMessage(user, 'uat grab Goldeneye'));
                });

                it('does not change the UAT assignment', function(done) {
                    adapter.receive(new TextMessage(user, 'uat grab Goldeneye'));
                    expect(brain.get('uatOwners')['Goldeneye']).to.equal('TestUser');
                    done();
                });
            });

            describe('and another user has the UAT', function() {
                beforeEach(function(done) {
                    brain.set('uatOwners', {'Goldeneye': 'AnotherUser', 'Donkeykong': '', 'Starfox': ''})
                    done();
                });

                it('tells the user who has the UAT', function(done) {
                    adapter.on('send', function(envelope, strings) {
                        expect(strings[0]).match(/AnotherUser already has Goldeneye/);
                        done();
                    });
                    adapter.receive(new TextMessage(user, 'uat grab Goldeneye'));
                });

                it('does not change the UAT assignment', function(done) {
                    adapter.receive(new TextMessage(user, 'uat grab Goldeneye'));
                    expect(brain.get('uatOwners')['Goldeneye']).to.equal('AnotherUser');
                    done();
                });
            });
        });

        describe('When the UAT does not exist', function() {
            it('says it is not a UAT', function(done) {
                adapter.on('send', function(envelope, strings) {
                    expect(strings[0]).match(/Not-a-uat is not a UAT/);
                    done();
                });
                adapter.receive(new TextMessage(user, 'uat grab Not-a-uat'));
            });
        });
    });

    describe('uat release <uat>', function() {

        describe('When the UAT exists', function() {
            describe('and the UAT is free', function() {
                it('says the UAT is not in use', function(done) {
                    adapter.on('send', function(envelope, strings) {
                        expect(strings[0]).match(/Starfox is not currently in use/);
                        done();
                    });
                    adapter.receive(new TextMessage(user, 'uat release Starfox'));
                });

                it('does not change the UAT assignment', function(done) {
                    adapter.receive(new TextMessage(user, 'uat release Starfox'));
                    expect(brain.get('uatOwners')['Starfox']).to.equal('');
                    done();
                });
            });

            describe('and the user has the UAT', function() {
                beforeEach(function(done) {
                    brain.set('uatOwners', {'Goldeneye': '', 'Donkeykong': '', 'Starfox': 'TestUser'})
                    done();
                });

                it('says the user has released the UAT', function(done) {
                    adapter.on('send', function(envelope, strings) {
                        expect(strings[0]).match(/TestUser has released Starfox/);
                        done();
                    });
                    adapter.receive(new TextMessage(user, 'uat release Starfox'));
                });

                it('removes the user from the UAT', function(done) {
                    adapter.receive(new TextMessage(user, 'uat release Starfox'));
                    expect(brain.get('uatOwners')['Starfox']).to.equal('');
                    done();
                });
            });

            describe('and another user has the UAT', function() {
                beforeEach(function(done) {
                    brain.set('uatOwners', {'Goldeneye': '', 'Donkeykong': '', 'Starfox': 'AnotherUser'})
                    done();
                });

                it('tells the user who has the UAT', function(done) {
                    adapter.on('send', function(envelope, strings) {
                        expect(strings[0]).match(/AnotherUser currently has Starfox/);
                        done();
                    });
                    adapter.receive(new TextMessage(user, 'uat release Starfox'));
                });

                it('does not change the UAT assignment', function(done) {
                    adapter.receive(new TextMessage(user, 'uat release Starfox'));
                    expect(brain.get('uatOwners')['Starfox']).to.equal('AnotherUser');
                    done();
                });
            });
        });

        describe('When the UAT does not exist', function() {
            it('says it is not a UAT', function(done) {
                adapter.on('send', function(envelope, strings) {
                    expect(strings[0]).match(/Not-a-uat is not a UAT/);
                    done();
                });
                adapter.receive(new TextMessage(user, 'uat release Not-a-uat'));
            });
        });
    });

    describe('uat steal <uat>', function() {

        describe('When the UAT exists', function() {
            beforeEach(function(done) {
                brain.set('uatOwners', {'Goldeneye': '', 'Donkeykong': '', 'Starfox': 'AnotherUser'})
                done();
            });

            it('says the user has stolen the UAT', function(done) {
                adapter.on('send', function(envelope, strings) {
                    expect(strings[0]).match(/TestUser has stolen Starfox/);
                    done();
                });
                adapter.receive(new TextMessage(user, 'uat steal Starfox'));
            });

            it('assigns the user to the UAT', function(done) {
                adapter.receive(new TextMessage(user, 'uat steal Starfox'));
                expect(brain.get('uatOwners')['Starfox']).to.equal('TestUser');
                done();
            });
        });

        describe('When the UAT does not exist', function() {
            it('says it is not a UAT', function(done) {
                adapter.on('send', function(envelope, strings) {
                    expect(strings[0]).match(/Not-a-uat is not a UAT/);
                    done();
                });
                adapter.receive(new TextMessage(user, 'uat steal Not-a-uat'));
            });
        });
    });

    describe('uat status', function() {
        beforeEach(function(done) {
            brain.set('uatOwners', {'Goldeneye': 'Test1', 'Donkeykong': 'Test2', 'Starfox': 'Test3'})
            done();
        });

        describe('uat status all', function() {
            it('lists all the UATs and their owners', function(done) {
                adapter.on('send', function(envelope, strings) {
                    expect(strings[0]).match(/Goldeneye: Test1\nDonkeykong: Test2\nStarfox: Test3/);
                    done();
                });
                adapter.receive(new TextMessage(user, 'uat status all'));
                done();
            });
        })

        describe('uat status <uat>', function() {
            it('lists the given UATs and their owners', function(done) {
                adapter.on('send', function(envelope, strings) {
                    expect(strings[0]).match(/Goldeneye: Test1\nStarfox: Test3/);
                    done();
                });
                adapter.receive(new TextMessage(user, 'uat status Goldeneye Starfox'));
                done();
            });

            it('strips out commas and white space', function(done) {
                adapter.on('send', function(envelope, strings) {
                    expect(strings[0]).match(/Starfox: Test3\nDonkeykong: Test2/);
                    done();
                });
                adapter.receive(new TextMessage(user, 'uat status Starfox, Donkeykong'));
                done();
            })
        })
    });
});

