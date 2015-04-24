var chai = require('chai');
var sinon = require('sinon');
var sinonChai = require('sinon-chai');
var should = chai.should(), expect = chai.expect;
chai.use(sinonChai);

var path   = require('path');
var shared = require('shared-examples-for');

var Robot       = require('hubot/src/robot');
var TextMessage = require('hubot/src/message').TextMessage;

describe('uatOwners', function() {
    var adapter, brain, robot, spy, user;

    beforeEach(function(done) {
        robot = new Robot(null, 'mock-adapter', false, 'UatBot');

        robot.adapter.on('connected', function() {
            robot.loadFile(path.resolve('node_modules/hubot/src'));
            require('../scripts/uatOwners')(robot);

            user = robot.brain.userForId('1', {
                name: 'TestUser',
                room: '#testroom'
            });

            adapter = robot.adapter;
            spy = sinon.spy(adapter, 'send');
            brain = robot.brain;
            done();
        });

        robot.run();
    });

    afterEach(function() {
        robot.shutdown();
    });

    shared.examplesFor('message response', function(attributes) {
        it('responds to the user\'s message', function(done) {
            adapter.on('send', function(envelope, strings) {
                expect(strings[0]).match(new RegExp(attributes.response));
                done();
            });
            adapter.receive(new TextMessage(user, attributes.request));
            spy.should.have.been.called;
        });
    });

    it('retrieves a UAT name from a string and returns it in lower case', function(done) {
        adapter.on('send', function(envelope, strings) {
            expect(strings[0]).match(/goldeneye/);
            done();
        });
        adapter.receive(new TextMessage(user, 'uat grab goLDENEye'));
    });

    describe('uat help', function() {
        var expectedResponse = [
            'uat grab <uat>     - allocates the user to the UAT if the UAT is available',
            'uat release <uat>  - removes the user from the UAT',
            'uat steal <uat>    - allocates the user to the UAT even if the UAT is not available',
            'uat status         - returns all the default UAT names and the name of the person currrently allocated to them',
            'uat status <uat>   - returns the status of all listed UATs; multiple UAT names can be separated by commas or spaces',
            'uat status all     - returns the status of all known UATs',
            'uat default <uat>  - sets default UATs for the room (for use with `uat status`); multiple default UATs can be set, separated by commas or spaces'
        ].join('\n')

        it('displays all known uat commands', function(done) {
            adapter.on('send', function(envelope, strings) {
                expect(strings[0]).to.equal(expectedResponse);
                done();
            });
            adapter.receive(new TextMessage(user, 'uat help'));
            spy.should.have.been.called;
        });
    });

    describe('uat grab <uat>', function() {

        describe('When the UAT exists', function() {
            describe('and the UAT is free', function() {
                shared.shouldBehaveLike('message response',
                    { request: 'uat grab goldeneye', response: 'TestUser has grabbed goldeneye' }
                );

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

                shared.shouldBehaveLike('message response',
                    { request: 'uat grab goldeneye', response: 'You already have goldeneye, TestUser' }
                );

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

                shared.shouldBehaveLike('message response',
                    { request: 'uat grab goldeneye', response: 'AnotherUser already has goldeneye' }
                );

                it('does not change the UAT assignment', function(done) {
                    adapter.receive(new TextMessage(user, 'uat grab goldeneye'));
                    expect(brain.get('uatOwners')['goldeneye']).to.equal('AnotherUser');
                    done();
                });
            });
        });

        describe('When the UAT is not registered', function() {
            shared.shouldBehaveLike('message response',
                { request: 'uat grab not_a_uat', response: 'I don\'t know anything about not_a_uat' }
            );
        });
    });

    describe('uat release <uat>', function() {

        describe('When the UAT exists', function() {
            describe('and the UAT is free', function() {
                shared.shouldBehaveLike('message response',
                    { request: 'uat release starfox', response: 'starfox is not currently in use' }
                );

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

                shared.shouldBehaveLike('message response',
                    { request: 'uat release starfox', response: 'TestUser has released starfox' }
                );

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

                shared.shouldBehaveLike('message response',
                    { request: 'uat release starfox', response: 'AnotherUser currently has starfox' }
                );

                it('does not change the UAT assignment', function(done) {
                    adapter.receive(new TextMessage(user, 'uat release starfox'));
                    expect(brain.get('uatOwners')['starfox']).to.equal('AnotherUser');
                    done();
                });
            });
        });

        describe('When the UAT is not registered', function() {
            shared.shouldBehaveLike('message response',
                { request: 'uat release not_a_uat', response: 'I don\'t know anything about not_a_uat' }
            );
        });
    });

    describe('uat steal <uat>', function() {

        describe('When the UAT exists', function() {
            beforeEach(function(done) {
                brain.set('uatOwners', {'goldeneye': '', 'donkeykong': '', 'starfox': 'AnotherUser'})
                done();
            });

            shared.shouldBehaveLike('message response',
                { request: 'uat steal starfox', response: 'TestUser has stolen starfox' }
            );

            it('assigns the user to the UAT', function(done) {
                adapter.receive(new TextMessage(user, 'uat steal starfox'));
                expect(brain.get('uatOwners')['starfox']).to.equal('TestUser');
                done();
            });
        });

        describe('When the UAT is not registered', function() {
            shared.shouldBehaveLike('message response',
                { request: 'uat steal not_a_uat', response: 'I don\'t know anything about not_a_uat' }
            );
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
                    brain.set('roomSettings', {'#testroom': {'uat': ['goldeneye', 'kirby'] }});
                    done();
                })

                shared.shouldBehaveLike('message response',
                    { request: 'uat status', response: 'goldeneye: \nkirby: Test3\n' }
                );
            });

            describe('when default UATs have not been set', function() {
                var expectedResponse = [
                    'astroboy: Test1', 'derbystallion: Test2', 'donkeykong: ', 'doubledragon: ',
                    'galaga: ', 'ghostbusters: ', 'goldeneye: ', 'iceclimber: ', 'kirby: Test3',
                    'mariogolf: ', 'metroid: ', 'mickeymania: Test4', 'mortalkombat: ', 'pikmin: ',
                    'quake: ', 'starfox: ', 'streetfighter: ', 'yoshi: ', 'zelda: \n'
                ].join('\n')

                shared.shouldBehaveLike('message response',
                    { request: 'uat status', response: expectedResponse }
                );
            });
        });

        describe('uat status all', function() {
            var expectedResponse = [
                'astroboy: Test1', 'derbystallion: Test2', 'donkeykong: ', 'doubledragon: ',
                'galaga: ', 'ghostbusters: ', 'goldeneye: ', 'iceclimber: ', 'kirby: Test3',
                'mariogolf: ', 'metroid: ', 'mickeymania: Test4', 'mortalkombat: ', 'pikmin: ',
                'quake: ', 'starfox: ', 'streetfighter: ', 'yoshi: ', 'zelda: \n'
            ].join('\n')

            shared.shouldBehaveLike('message response',
                { request: 'uat status', response: expectedResponse }
            );
        });

        describe('uat status <uat>', function() {
            describe('when UAT names are comma separated', function() {
                shared.shouldBehaveLike('message response',
                    { request: 'uat status starfox, derbystallion', response: 'starfox: \nderbystallion: Test2\n' }
                );
            });

            describe('when UAT names are space separated', function() {
                shared.shouldBehaveLike('message response',
                    { request: 'uat status astroboy starfox', response: 'astroboy: Test1\nstarfox: \n' }
                );
            });

            describe('when the UAT names are invalid', function() {
                shared.shouldBehaveLike('message response',
                    { request: 'uat status fudge broom', response: 'I don\'t know anything about those UATs' }
                );
            });

            describe('when the UAT names are a combination of valid and invalid', function() {
                shared.shouldBehaveLike('message response',
                    { request: 'uat status astroboy invalid starfox', response: 'astroboy: Test1\nstarfox: \n' }
                );
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

            shared.shouldBehaveLike('message response',
                { request: 'uat default yoshi, zelda', response: 'Default UATs for #testroom are now: yoshi zelda' }
            );
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

            shared.shouldBehaveLike('message response',
                { request: 'uat default pikmin, metroid', response: 'Default UATs for #testroom are now: pikmin metroid' }
            );
        });
    });
});

