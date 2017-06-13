"use strict";

/**
 * Provides sorting methods.
 * @mixin
 */
var Sorting = {
	/**
	 * Sorts the passed value a against the passed value b ascending.
	 * @param {*} a The first value to compare.
	 * @param {*} b The second value to compare.
	 * @param {Object=} options An optional options object that can
	 * set behaviour of the sort.
	 * @returns {*} 1 if a is sorted after b, -1 if a is sorted before b.
	 */
	sortAsc: function (a, b, options) {
		if (typeof(a) === 'string' && typeof(b) === 'string') {
			return a.localeCompare(b);
		} else {
			if (a > b) {
				return 1;
			} else if (a < b) {
				return -1;
			}
		}
		
		if (options && options.handleUndefined !== false) {
			if (a === undefined && b !== undefined) {
				return -1;
			}
			
			if (b === undefined && a !== undefined) {
				return 1;
			}
		}

		return 0;
	},

	/**
	 * Sorts the passed value a against the passed value b descending.
	 * @param {*} a The first value to compare.
	 * @param {*} b The second value to compare.
	 * @param {Object=} options An optional options object that can
	 * set behaviour of the sort.
	 * @returns {*} 1 if a is sorted after b, -1 if a is sorted before b.
	 */
	sortDesc: function (a, b, options) {
		if (typeof(a) === 'string' && typeof(b) === 'string') {
			return b.localeCompare(a);
		} else {
			if (a > b) {
				return -1;
			} else if (a < b) {
				return 1;
			}
		}
		
		if (options && options.handleUndefined !== false) {
			if (a === undefined && b !== undefined) {
				return 1;
			}
			
			if (b === undefined && a !== undefined) {
				return -1;
			}
		}

		return 0;
	}
};

module.exports = Sorting;