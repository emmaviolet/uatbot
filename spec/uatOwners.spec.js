var chai = require('chai');
var should = chai.should(), expect = chai.expect;

var path   = require('path');
var Robot       = require('hubot/src/robot');
var TextMessage = require('hubot/src/message').TextMessage;

// The below to be refactored on a future turn

describe('uatOwners', function() {
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
                    expect(strings[0]).match(/I don't know anything about not_a_uat/);
                    done();
                });
                adapter.receive(new TextMessage(user, 'uat grab not_a_uat'));
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
                    expect(strings[0]).match(/I don't know anything about not_a_uat/);
                    done();
                });
                adapter.receive(new TextMessage(user, 'uat release not_a_uat'));
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
                    expect(strings[0]).match(/I don't know anything about not_a_uat/);
                    done();
                });
                adapter.receive(new TextMessage(user, 'uat steal not_a_uat'));
            });
        });
    });

    describe('uat status', function() {
        beforeEach(function(done) {
            brain.set('uatOwners', {
                'astroboy': 'Test1', 'derbystallion': 'Test2', 'donkeykong': '', 'doubledragon': '', 'galaga': '', 'ghostbusters': '',
                'goldeneye': '','iceclimber': '','kirby': 'Test3', 'mariogolf': '', 'metroid': '', 'mickeymania': 'Test4',
                'mortalkombat': '', 'pikmin': '', 'quake': '', 'starfox': '', 'streetfighter': '', 'yoshi': '', 'zelda': ''
            })
            done();
        });

        describe('uat status', function() {
            describe('when default UATs have been set', function() {
                beforeEach(function(done) {
                    brain.set('roomSettings', {'#testroom': ['goldeneye', 'kirby'] });
                    done();
                })
                it('lists the default UATs and their owners', function(done) {
                    adapter.on('send', function(envelope, strings) {
                        expect(strings[0]).match(/goldeneye: \nkirby: Test3/);
                        done();
                    });
                    adapter.receive(new TextMessage(user, 'uat status'));
                    done();
                });
            });

            describe('when default UATs have not been set', function() {
                it('lists all the UATs and their owners', function(done) {
                    adapter.on('send', function(envelope, strings) {
                        expect(strings[0]).to.equal(
                            'astroboy: Test1\nderbystallion: Test2\ndonkeykong: \n' +
                            'doubledragon: \ngalaga: \nghostbusters: \ngoldeneye: \nkirby: ' +
                            'Test3\n mariogolf: undefined\nmetroid: \nmickeymania: Test4\n' +
                            'mortalkombat: \npikmin: \nquake: \nstarfox: \nyoshi: \nzelda: \n'
                        );
                        done();
                    });
                    adapter.receive(new TextMessage(user, 'uat status'));
                    done();
                });
            });
        });

        describe('uat status all', function() {
            it('lists all the UATs and their owners', function(done) {
                adapter.on('send', function(envelope, strings) {
                    expect(strings[0]).to.equal(
                        'astroboy: Test1\nderbystallion: Test2\ndonkeykong: \ndoubledragon: \n' +
                        'galaga: \nghostbusters: \ngoldeneye: \niceclimber: \nkirby: Test3\n' +
                        'mariogolf: \nmetroid: \nmickeymania: Test4\nmortalkombat: \n' +
                        'pikmin: \nquake: \nstarfox: \nstreetfighter: \nyoshi: \nzelda: \n'
                    );
                    done();
                });
                adapter.receive(new TextMessage(user, 'uat status all'));
                done();
            });
        });

        describe('uat status <uat>', function() {
            it('lists the given UATs and their owners', function(done) {
                adapter.on('send', function(envelope, strings) {
                    expect(strings[0]).match(/astroboy: Test1\nstarfox: /);
                    done();
                });
                adapter.receive(new TextMessage(user, 'uat status astroboy starfox'));
                done();
            });

            it('strips out commas and white space', function(done) {
                adapter.on('send', function(envelope, strings) {
                    expect(strings[0]).match(/starfox: \nderbystallion: Test2/);
                    done();
                });
                adapter.receive(new TextMessage(user, 'uat status starfox, derbystallion'));
                done();
            });
        });
    });

    describe('uat default <uat>', function() {
        describe('when no settings are assigned to the room', function() {
            it('creates settings for the room', function(done) {
                adapter.receive(new TextMessage(user, 'uat default yoshi, zelda'));
                expect(brain.get('roomSettings')['#testroom']).to.not.be.undefined;
                done();
            });

            it('assigns the uats to the room', function(done) {
                adapter.receive(new TextMessage(user, 'uat default yoshi, zelda'));
                expect(brain.get('roomSettings')['#testroom']['uat']).to.include('yoshi');
                expect(brain.get('roomSettings')['#testroom']['uat']).to.include('zelda');
                done();
            });

            it('sends the default UAT settings to the room', function(done) {
                adapter.on('send', function(envelope, strings) {
                    expect(strings[0]).match(/Default UATs for #testroom are now: yoshi zelda/);
                    done();
                });
                adapter.receive(new TextMessage(user, 'uat default yoshi, zelda'));
            });
        });
        describe('when settings are already assigned to the room', function() {
            beforeEach(function(done) {
                brain.set('roomSettings', {
                    '#testroom': {
                        'uat': [ 'goldeneye', 'derbystallion' ],
                        'other': 'test-value'
                    }
                });
                done();
            });

            it('does not replace other room settings', function(done) {
                adapter.receive(new TextMessage(user, 'uat default pikmin, metroid'));
                expect(brain.get('roomSettings')['#testroom']['other']).to.equal('test-value');
                done();
            });

            it('assigns the uats to the room', function(done) {
                adapter.receive(new TextMessage(user, 'uat default pikmin, metroid'));
                expect(brain.get('roomSettings')['#testroom']['uat']).to.include('pikmin');
                expect(brain.get('roomSettings')['#testroom']['uat']).to.include('metroid');
                done();
            });

            it('replaces previous defaults', function(done) {
                adapter.receive(new TextMessage(user, 'uat default pikmin, metroid'));
                expect(brain.get('roomSettings')['#testroom']['uat']).not.to.include('goldeneye');
                expect(brain.get('roomSettings')['#testroom']['uat']).not.to.include('derbystallion');
                done();
            });

            it('sends the default UAT settings to the room', function(done) {
                adapter.on('send', function(envelope, strings) {
                    expect(strings[0]).match(/Default UATs for #testroom are now: pikmin metroid/);
                    done();
                });
                adapter.receive(new TextMessage(user, 'uat default pikmin, metroid'));
            });
        });
    });
});

