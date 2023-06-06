# MongoDB Customer Synchronization

This project assumes you have a working instance of MongoDB in replica set mode.

## Getting Started

To start the application, follow these steps:

1. Install dependencies:

``` npm install```

2. Start the application:

```npm run start:app```

This script will save new customers to the database.

3. Open another terminal window/tab.

4. Start the synchronization script:

```npm run start:sync```

This script will listen for changes in the customers collection, gather them, and update them in batches of 1000 or fewer, once per second (configurable).

5. Optionally, you can run the full reindex command in another terminal window/tab:

```npm run start:fullReindex```

or:

```npm run build && node ./build/sync.js --full-reindex```

This command performs a full synchronization of the customer and anonymizeCustomer collections.

Please ensure that you have a MongoDB replica set running before starting the application. Adjust the configuration in the code to match your MongoDB setup if necessary.
If, for any reason, you are unable to run MongoDB in replica set mode, you can use .post hooks. An example of the configuration is provided in the file: src/models/Customer.ts.