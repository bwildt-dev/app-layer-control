assert    = require "assert"
mongoose  = require "mongoose"
{ pluck } = require "underscore"

createTestDatabase = require "./utils/createTestDatabase"
createStore        = require "../src/server/store"
enrichAppsForMqtt  = require "../src/server/helpers/enrichAppsForMqtt"
# label, applications, cb

describe ".enrichAppsForMqtt", ->
	store  = null
	enrich = null

	before ->
		db         = await createTestDatabase()
		store      = createStore db
		{ enrich } = enrichAppsForMqtt db

	after ->
		mongoose
			.connection
			.db
			.dropDatabase()

	it "should throw if no label is specified", ->
		assert.throws ->
			enrich undefined, undefined

	it "should throw if no applications are specified", ->
		assert.throws ->
			enrich "default", undefined

	it "should determine the correct versions to run", (done) ->
		store.getGroups (error, groups) ->
			name         = "default"
			applications = groups
				.get name
				.toJS()

			enrich name, applications, (error, enriched) ->
				return done error if error

				# assert.every applications
				fromImages = pluck enriched, "fromImage"
				expected   = ["hello-world:1.0.0", "hello-world:1.1.1", "hello-world:tag-1"]

				assert.ok expected.every (tag) ->
					fromImages.includes tag

				done()
