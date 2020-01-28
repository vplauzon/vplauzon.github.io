---
title: Invoking a Stored Procedure from a partitioned CosmosDB collection from Logic Apps
date: 2017-10-19 12:45:31 -07:00
permalink: /2017/10/19/invoking-a-stored-procedure-from-a-partitioned-cosmosdb-collection-from-logic-apps/
categories:
- Solution
tags:
- Integration
- NoSQL
- Serverless
---
I struggled a little to make that work, so I thought I would share the learning in order to accelerate your future endeavour.

I was looking at a way to populate a CosmosDB quickly with random data.

Stored Procedures came to mind since they would skip client-server latency.  We can call a stored procedure creating hundreds of documents with random data.

Each Stored Procedure runs in a partition, so we need something external to the stored procedure to loop and decide of the partition key.

Enter Logic Apps:  cheap to run and quick to setup.

<h2>Stored Procedure</h2>

Something important to realize is that some portal features aren’t supported when we deal with a partitioned collection.

One of them is to update the content of a stored procedure (same thing for triggers).  We therefore need to delete it and re-create it.

Here is the stored procedure we used:

```JavaScript

function createRecords(recordCount) {
    var context = getContext();
    var collection = context.getCollection();
    var createdIds = [];

    for (i = 0; i < recordCount; i++) {
        var documentToCreate = { part: "abc", name: "sample" + i };
        var accepted = collection.createDocument(
            collection.getSelfLink(),
            documentToCreate,
            function (err, documentCreated) {
                if (err) {
                    throw new Error('Error' + err.message);
                }
                else {
                    createdIds.push(documentCreated.id);
                }
            });

        if (!accepted)
            return;
    }

    context.getResponse().setBody(createdIds)
}
```

We take the number of documents to create in parameter, loop &amp; create documents.  We return the document IDs in a list in the output.

The documents we create are trivial:  no random data.

<h2>Logic App</h2>

On the canvas, let’s type <em>Cosmos </em>in the search box for actions.

<a href="/assets/posts/2017/4/invoking-a-stored-procedure-from-a-partitioned-cosmosdb-collection-from-logic-apps/image4.png"><img style="border:0 currentcolor;display:inline;background-image:none;" title="image" src="/assets/posts/2017/4/invoking-a-stored-procedure-from-a-partitioned-cosmosdb-collection-from-logic-apps/image_thumb4.png" alt="image" border="0" /></a>

Let’s choose <em>Execute stored procedure</em>.

We are prompted to create a new Cosmos DB connection.  We need to:

<ul>
    <li>Type a name for the connection (purely for readability, can be anything)</li>
    <li>Select an existing Cosmos DB collection</li>
</ul>

We can then pick the database ID, the collection ID &amp; the stored procedure ID.

<a href="/assets/posts/2017/4/invoking-a-stored-procedure-from-a-partitioned-cosmosdb-collection-from-logic-apps/image5.png"><img style="border:0 currentcolor;display:inline;background-image:none;" title="image" src="/assets/posts/2017/4/invoking-a-stored-procedure-from-a-partitioned-cosmosdb-collection-from-logic-apps/image_thumb5.png" alt="image" border="0" /></a>

Stored Procedure parameters are expressed as a JSON array.  For instance here, we want to pass 1000 as the <em>recordCount</em> parameter, so we type <em>[1000]</em>:  no parameter name and always square brackets.

If we would run the app now we would get an error stating the operation requires the partition key.

In order to set the partition key, we need to <em>Show advanced options</em>.

<a href="/assets/posts/2017/4/invoking-a-stored-procedure-from-a-partitioned-cosmosdb-collection-from-logic-apps/image6.png"><img style="border:0 currentcolor;display:inline;background-image:none;" title="image" src="/assets/posts/2017/4/invoking-a-stored-procedure-from-a-partitioned-cosmosdb-collection-from-logic-apps/image_thumb6.png" alt="image" border="0" /></a>

In order to specify the partition key value, we simply type its value:  no square bracket, no quotes.

Now we can run the Logic App and it should execute the stored procedure and get its output in the action’s output.

<h2>Summary</h2>

Invoking a Cosmos DB stored procedure from Logic App isn’t rocket science but there are a few items to get straight in order for it to work properly.