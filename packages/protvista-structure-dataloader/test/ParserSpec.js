require('babel-core/register');

var test = require('../src/Parser.js');
// chai is an assertion library
var chai = require('chai');

// @see http://chaijs.com/api/assert/
var assert = chai.assert;

// register alternative styles
// @see http://chaijs.com/api/bdd/
var expect = chai.expect;
var should = chai.should;

describe('Parser', () => {
	it('should pass', function() {
	    var test = true;
	    assert.equal(test, true);
	});

	it('should see Parser', () => {
	    test('aa', 'b', 22, 43);
	});
});