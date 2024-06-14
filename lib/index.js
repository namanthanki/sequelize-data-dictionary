const Sequelize = require("sequelize");
const yaml = require("js-yaml");
const logger = require("./logger");

class DataDictionaryGenerator {
	/**
	 * Create a new instance of the DataDictionaryGenerator class.
	 * @param {Sequelize} sequelize - An instance of the Sequelize object.
	 * @param {Object} [options] - Options for generating the data dictionary.
	 * @param {string} [options.format='json'] - The format of the output data dictionary (e.g., 'json', 'yaml', 'markdown').
	 */
	constructor(sequelize, options = {}) {
		this.sequelize = sequelize;
		this.queryInterface = sequelize.getQueryInterface();
		this.options = {
			format: "json",
			...options,
		};
		logger.info("DataDictionaryGenerator initialized");
	}

	/**
	 * Generate a data dictionary for the database.
	 * @returns {Promise<Object|string>} A promise that resolves to the data dictionary in the specified format.
	 */
	async generateDataDictionary() {
		try {
			const tables = await this.queryInterface.showAllTables();
			const dataDictionary = {};

			for (const table of tables) {
				const tableInfo = await this.queryInterface.describeTable(
					table
				);
				const columns = Object.entries(tableInfo).map(
					([name, details]) => ({ name, ...details })
				);
				const foreignKeys =
					await this.queryInterface.getForeignKeyReferencesForTable(
						table
					);
				const indexes = await this.queryInterface.showIndex(table);
				const primaryKeys = columns.filter(
					(column) => column.primaryKey
				);

				dataDictionary[table] = {
					tableInfo,
					columns,
					foreignKeys,
					indexes,
					primaryKeys,
				};

				logger.info(`Fetched details for table: ${table}`);
			}

			return this.formatDataDictionary(dataDictionary);
		} catch (error) {
			logger.error("Error generating data dictionary:", error);
			throw error;
		}
	}

	/**
	 * Format the data dictionary based on the specified output format.
	 * @param {Object} dataDictionary - The data dictionary object.
	 * @returns {Object|string} The formatted data dictionary.
	 */
	formatDataDictionary(dataDictionary) {
		switch (this.options.format) {
			case "json":
				return JSON.stringify(
					this.formatForJson(dataDictionary),
					null,
					2
				);
			case "yaml":
				return yaml.dump(this.formatForJson(dataDictionary));
			case "markdown":
				return this.formatMarkdownDataDictionary(dataDictionary);
			default:
				return dataDictionary;
		}
	}

	/**
	 * Format the data dictionary for JSON/YAML output.
	 * @param {Object} dataDictionary - The data dictionary object.
	 * @returns {Object} The formatted data dictionary.
	 */
	formatForJson(dataDictionary) {
		const formattedDictionary = {};
		for (const [table, tableData] of Object.entries(dataDictionary)) {
			formattedDictionary[table] = {
				columns: tableData.columns.map((column) => ({
					name: column.name,
					type: column.type,
					allowNull: column.allowNull,
					defaultValue: column.defaultValue,
					primaryKey: column.primaryKey,
					foreignKey: tableData.foreignKeys.find(
						(fk) => fk.columnName === column.name
					)
						? `${
								tableData.foreignKeys.find(
									(fk) => fk.columnName === column.name
								).referencedTableName
						  }.${
								tableData.foreignKeys.find(
									(fk) => fk.columnName === column.name
								).referencedColumnName
						  }`
						: null,
				})),
				foreignKeys: tableData.foreignKeys,
				indexes: tableData.indexes,
			};
		}
		return formattedDictionary;
	}

	/**
	 * Format the data dictionary as a Markdown string.
	 * @param {Object} dataDictionary - The data dictionary object.
	 * @returns {string} The Markdown-formatted data dictionary.
	 */
	formatMarkdownDataDictionary(dataDictionary) {
		let markdown = "# Data Dictionary\n\n";

		for (const [table, tableData] of Object.entries(dataDictionary)) {
			markdown += `## ${table}\n\n`;

			markdown += "### Table Information\n\n";
			markdown += "```json\n";
			markdown += JSON.stringify(tableData.tableInfo, null, 2);
			markdown += "\n```\n\n";

			markdown += "### Columns\n\n";
			markdown +=
				"| Name | Type | Null | Default | Primary Key | Foreign Key |\n";
			markdown +=
				"|------|------|------|---------|-------------|-------------|\n";
			for (const column of tableData.columns) {
				const foreignKey = tableData.foreignKeys.find(
					(fk) => fk.columnName === column.name
				);
				markdown += `| ${column.name} | ${column.type} | ${
					column.allowNull ? "YES" : "NO"
				} | ${column.defaultValue || ""} | ${
					column.primaryKey ? "YES" : "NO"
				} | ${
					foreignKey
						? `${foreignKey.referencedTableName}.${foreignKey.referencedColumnName}`
						: ""
				} |\n`;
			}
			markdown += "\n";

			markdown += "### Foreign Keys\n\n";
			markdown += "```json\n";
			markdown += JSON.stringify(tableData.foreignKeys, null, 2);
			markdown += "\n```\n\n";

			markdown += "### Indexes\n\n";
			markdown += "```json\n";
			markdown += JSON.stringify(tableData.indexes, null, 2);
			markdown += "\n```\n\n";

			markdown += "### Primary Keys\n\n";
			markdown += "```json\n";
			markdown += JSON.stringify(tableData.primaryKeys, null, 2);
			markdown += "\n```\n\n---\n\n";
		}

		markdown += this.generateRelationView(dataDictionary);

		return markdown;
	}

	/**
	 * Generate a relation view using Mermaid.
	 * @param {Object} dataDictionary - The data dictionary object.
	 * @returns {string} The Mermaid diagram code.
	 */
	generateRelationView(dataDictionary) {
		let mermaid = "```mermaid\n";
		mermaid += "erDiagram\n";

		for (const [table, tableData] of Object.entries(dataDictionary)) {
			mermaid += `  ${table} {\n`;
			for (const column of tableData.columns) {
				mermaid += `    ${column.type} ${column.name} ${
					column.allowNull ? "NULL" : "NOT NULL"
				}\n`;
			}
			mermaid += "  }\n";
		}

		for (const [table, tableData] of Object.entries(dataDictionary)) {
			for (const foreignKey of tableData.foreignKeys) {
				mermaid += `  ${table} }|--|| ${foreignKey.referencedTableName} : "${foreignKey.columnName} -> ${foreignKey.referencedColumnName}"\n`;
			}
		}

		mermaid += "```\n";

		return mermaid;
	}
}

module.exports = DataDictionaryGenerator;
