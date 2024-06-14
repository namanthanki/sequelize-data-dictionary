const Sequelize = require("sequelize");
const DataDictionaryGenerator = require("./DataDictionaryGenerator");

describe("DataDictionaryGenerator", () => {
	let sequelize;

	beforeAll(() => {
		sequelize = new Sequelize("sqlite::memory:");
	});

	beforeEach(async () => {
		await sequelize.sync({ force: true });
		await sequelize.define("User", {
			id: {
				type: Sequelize.INTEGER,
				primaryKey: true,
				autoIncrement: true,
			},
			name: { type: Sequelize.STRING, allowNull: false },
			email: { type: Sequelize.STRING, allowNull: false, unique: true },
		});
		await sequelize.define("Post", {
			id: {
				type: Sequelize.INTEGER,
				primaryKey: true,
				autoIncrement: true,
			},
			title: { type: Sequelize.STRING, allowNull: false },
			content: { type: Sequelize.TEXT, allowNull: false },
			userId: {
				type: Sequelize.INTEGER,
				references: { model: "Users", key: "id" },
			},
		});
		await sequelize.sync();
	});

	afterAll(async () => {
		await sequelize.close();
	});

	test("generate data dictionary in JSON format", async () => {
		const generator = new DataDictionaryGenerator(sequelize, {
			format: "json",
		});
		const dataDictionary = await generator.generateDataDictionary();
		expect(typeof dataDictionary).toBe("string");
		expect(JSON.parse(dataDictionary)).toHaveProperty("Users");
		expect(JSON.parse(dataDictionary)).toHaveProperty("Posts");
	});

	test("generate data dictionary in YAML format", async () => {
		const generator = new DataDictionaryGenerator(sequelize, {
			format: "yaml",
		});
		const dataDictionary = await generator.generateDataDictionary();
		expect(typeof dataDictionary).toBe("string");
		expect(dataDictionary).toContain("Users:");
		expect(dataDictionary).toContain("Posts:");
	});

	test("generate data dictionary in Markdown format", async () => {
		const generator = new DataDictionaryGenerator(sequelize, {
			format: "markdown",
		});
		const dataDictionary = await generator.generateDataDictionary();
		expect(typeof dataDictionary).toBe("string");
		expect(dataDictionary).toContain("## Users");
		expect(dataDictionary).toContain("## Posts");
		expect(dataDictionary).toContain("```mermaid\n");
		expect(dataDictionary).toContain("erDiagram\n");
	});
});
