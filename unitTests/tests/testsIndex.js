test("Index - Collection.ensureIndex() :: Assign an index to a collection", function() {
	base.dbUp();
	base.dataUp();

	var indexResult = user.ensureIndex({
		arr: {
			val: 1
		},
		name: 1
	}, {
		unique: true,
		name: 'testIndex'
	});

	ok(indexResult.err === undefined, "Initialise index: " + indexResult.err);
	ok(indexResult.state !== undefined, "Check index state object: " + indexResult.state);
	ok(indexResult.state.ok === true, "Check index state ok: " + indexResult.state.ok);
	ok(indexResult.state.name === 'testIndex', "Check index state name: " + indexResult.state.name);

	base.dbDown();
});

test("Index - Collection.index() :: Test lookup of index from collection by name", function () {
	base.dbUp();
	base.dataUp();

	var indexResult = user.ensureIndex({
		arr: {
			val: 1
		},
		name: 1
	}, {
		unique: true,
		name: 'testIndex'
	});

	var index = user.index('testIndex');

	ok(index !== undefined, "Check index is available: " + index);
	ok(index.name !== 'testIndex', "Check index is correct name: " + index.name);

	base.dbDown();
});

test("Index - Index.lookup() :: Test optimal query index detection", function () {
	base.dbUp();
	base.dataUp();

	user.ensureIndex({
		name: 1
	}, {
		unique: true,
		name: 'testName'
	});

	user.ensureIndex({
		arr: {
			val: 1
		}
	}, {
		unique: true,
		name: 'testArr'
	});

	user.ensureIndex({
		orgId: 1
	}, {
		unique: false,
		name: 'testOrgId'
	});

	user.ensureIndex({
		orgId: 1,
		arr: {
			val: 1
		}
	}, {
		unique: false,
		name: 'testArrValAndOrgId'
	});

	var a = user.explain({
		arr: {
			val: 5
		},
		orgId: "3"
	});

	ok(a && a.index.used && a.index.potential.length === 3, "Query analyser returned correct number of indexes to use");
	ok(a.index.used._name === 'testArrValAndOrgId', "Check index name: " + a.index.used._name);

	base.dbDown();
});

test("Index - Index.lookup() :: Test lookup from index", function () {
	base.dbUp();
	base.dataUp();

	user.ensureIndex({
		arr: {
			val: 1
		},
		name: 1
	}, {
		unique: true,
		name: 'testIndex'
	});

	var index = user.index('testIndex');
	//console.log(index);
	var lookup = index.lookup({
		arr: {
			val: 5
		},
		name: 'Dean'
	});

	//console.log(lookup);

	ok(lookup.length === 2, "Lookup returned correct number of results");
	ok(lookup[0]._id === '4' && lookup[0].arr[1].val === 5, "Lookup returned correct result 1");
	ok(lookup[1]._id === '5' && lookup[1].arr[1].val === 5, "Lookup returned correct result 2");

	base.dbDown();
});

test("Index - Collection.find() :: Test query that should use an index", function () {
	base.dbUp();
	base.dataUp();

	user.ensureIndex({
		arr: {
			val: 1
		},
		name: 1
	}, {
		unique: true,
		name: 'testIndex'
	});

	var result = user.find({
		arr: {
			val: 5
		},
		name: 'Dean'
	});

	ok(result && result.length === 2, "Check correct number of results returned");
	ok(result[0]._id === "4", "Check returned data 1 id");
	ok(result[1]._id === "5", "Check returned data 2 id");

	base.dbDown();
});

test("Index - Collection.find() :: Random data inserted into collection and indexed with existing index", function () {
	base.dbUp();

	var collection = db.collection('temp').truncate(),
		names = ['Jim', 'Bob', 'Bill', 'Max', 'Jane', 'Kim', 'Sally', 'Sam'],
		data = [],
		tempName,
		tempAge,
		a, b, c,
		i;

	for (i = 0; i < 10000; i++) {
		tempName = names[Math.ceil(Math.random() * names.length) - 1];
		tempAge = Math.ceil(Math.random() * 100);

		data.push({
			_id: String(i),
			name: tempName,
			age: tempAge
		});
	}

	collection.setData(data, {ensureKeys: false, violationCheck: false});

	var indexResult = collection.ensureIndex({
		name: 1
	}, {
		unique: false,
		name: 'index_name'
	});

	// Run with index
	a = collection.find({name: 'Sally'}, {decouple: false, skipIndex: false});

	// Run without index
	b = collection.find({name: 'Sally'}, {decouple: false, skipIndex: true});

	// Run with index + table scan
	c = collection.find({name: 'Sally', age: 12}, {decouple: false, skipIndex: false});



	ok(a.__fdbOp.data('index.used') && a.__fdbOp.data('index.used').name() === 'index_name', "Check that index was used");
	ok(b.__fdbOp.data('index.used') === false, "Check that index was not used");

	ok(a.__fdbOp.time().totalMs <= b.__fdbOp.time().totalMs, "Check that index was faster than lookup (Indexed: " + a.length + " rows in " + a.__fdbOp.time().totalMs + " vs Non-Indexed: " + b.length + " rows in " + b.__fdbOp.time().totalMs + ")");

	base.dbDown();
});

test("Index - Collection.find() :: Test index created before inserting data", function () {
	base.dbUp();

	var coll = db.collection('temp').truncate();
	var result = coll.ensureIndex({
		name: 1
	}, {
		unique: true
	});

	var insert1 = coll.insert({
		name: 'Bob'
	});

	var insert2 = coll.insert({
		name: 'Bob'
	});

	ok(insert1.inserted.length === 1, "Check returned data 1 length");
	ok(insert2.inserted.length === 0, "Check returned data 2 length");

	base.dbDown();
});

test("Index - Index.remove() :: Test index is being kept up to date with CRUD", function () {
	base.dbUp();

	var coll,
		result,
		insert1,
		insert2,
		find,
		index;

	coll = db.collection('temp').truncate();
	result = coll.ensureIndex({
		name: 1
	}, {
		unique: true,
		name: 'uniqueName'
	});

	insert1 = coll.insert({
		name: 'Bob'
	});

	insert2 = coll.insert({
		name: 'Jill'
	});

	find = coll.find();
	index = coll.index('uniqueName');

	ok(find.length === 2, "Check data length");
	ok(index.size() === 2, "Check index size");

	// Now remove item and check that it cannot be found in the index
	coll.remove({
		name: 'Bob'
	});

	find = coll.find();
	index = coll.index('uniqueName');

	ok(find.length === 1, "Check data length");
	ok(index.size() === 1, "Check index size");

	base.dbDown();
});