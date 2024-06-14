# sequelize-data-dictionary

A library for working with data dictionaries in Sequelize, an Object-Relational Mapping (ORM) library for Node.js and PostgreSQL, MySQL, SQLite, and Microsoft SQL Server.

## Installation

```bash
npm install sequelize-data-dictionary
```

## Usage

```js
const Sequelize = require('sequelize');
const DataDictionaryGenerator = require('sequelize-data-dictionary');

const sequelize = new Sequelize('sqlite::memory:');
const dataDictionaryGenerator = new DataDictionaryGenerator(sequelize, { format: 'json' });
```

The DataDictionaryGenerator constructor accepts an optional options object, where you can specify the desired output format for the data dictionary. The supported formats are json (default), yaml, and markdown.

Then, you can use the generateDataDictionary method to generate the data dictionary:

```js
async function generateDataDictionary() {
  const dataDictionary = await dataDictionaryGenerator.generateDataDictionary();
  console.log(dataDictionary);
}

generateDataDictionary();
```

This will generate a data dictionary for the specified database and log it to the console in the specified format.

## API
``DataDictionaryGenerator`` Class

Constructor
- ``new DataDictionaryGenerator(sequelize, [options])``: Creates a new instance of the ``DataDictionaryGenerator`` class.

    - `sequelize` (Sequelize): An instance of the Sequelize object.
    - `options` (Object): An optional object with the following properties:
    
        -  `format` (string): The format of the output data dictionary (`json`, `yaml`, or `markdown`). Defaults to `json`.
    
Methods

- `async generateDataDictionary(): Promise<Object|string>`: Generate a data dictionary for the database.
    
    - Returns a promise that resolves to the data dictionary in the specified format.

The generated data dictionary will contain information about all tables in the database, including table information, columns, foreign keys, indexes, and primary keys.

## Contributing

If you'd like to contribute to the sequelize-data-dictionary library, please follow these steps:

- Fork the repository on GitHub.
- Create a new branch for your feature or bug fix: git checkout -b my-new-feature.
- Make your changes and commit them: git commit -am 'Add some feature'.
- Push your changes to your forked repository: git push origin my-new-feature.
- Create a new Pull Request on GitHub.

Please ensure that your code follows the existing coding style and includes tests for any new functionality or bug fixes.