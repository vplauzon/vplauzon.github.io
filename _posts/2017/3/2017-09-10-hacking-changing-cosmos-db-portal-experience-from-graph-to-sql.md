---
title: 'Hacking: changing Cosmos DB Portal experience from Graph to SQL'
date: 2017-09-10 15:00:27 -07:00
permalink: /2017/09/10/hacking-changing-cosmos-db-portal-experience-from-graph-to-sql/
categories:
- Solution
tags:
- NoSQL
---
In the <a href="https://vincentlauzon.com/2017/09/05/hacking-accessing-a-graph-in-cosmos-db-with-sql-documentdb-api/">last article</a>, we looked at how we could access a graph using the SQL (aka DocumentDB) API.

Here we’ll explore how we can switch the Portal experience from one to the other.
<h2>Portal Experience</h2>
The <em>Portal Experience </em>refers to the way the portal lets us interact with Cosmos DB Data.  It’s basically the <em>Data Explorer</em> experience.

Here we have the Cosmos DB <em>Graph</em> experience:

<a href="/assets/posts/2017/3/hacking-changing-cosmos-db-portal-experience-from-graph-to-sql/image.png"><img style="border:0 currentcolor;display:inline;background-image:none;" title="image" src="/assets/posts/2017/3/hacking-changing-cosmos-db-portal-experience-from-graph-to-sql/image_thumb.png" alt="image" border="0" /></a>

The Data Explorer lets us access the Graph using Gremlin and displays results in a Graph UI experience (i.e. showing vertices &amp; edges).

Let’s compare this to the Cosmos DB <em>SQL</em> (aka <em>DocumentDB</em>) experience:

<a href="/assets/posts/2017/3/hacking-changing-cosmos-db-portal-experience-from-graph-to-sql/image2.png"><img style="border:0 currentcolor;display:inline;background-image:none;" title="image" src="/assets/posts/2017/3/hacking-changing-cosmos-db-portal-experience-from-graph-to-sql/image_thumb2.png" alt="image" border="0" /></a>

Here we query collections using SQL queries and results are shown as JSON documents.
<h2>CosmosDB in ARM</h2>
The schema for JSON ARM template of CosmosDB Database Account is <a href="https://docs.microsoft.com/en-ca/azure/templates/microsoft.documentdb/databaseaccounts" target="_blank" rel="noopener">documented here</a>.

There are two important properties for Cosmos DB model (i.e. SQL, Graph, Table or MongoDB):  <em>kind</em> and <em>defaultExperience</em> (on fourth and seventh line respectively).

```javascript

{
  "apiVersion": "2015-04-08",
  "type": "Microsoft.DocumentDB/databaseAccounts",
  "kind": "[parameters('kind')]",
  "name": "[parameters('databaseAccountName')]",
  "tags": {
    "defaultExperience": "[parameters('experience')]"
  },
  "location": "[resourceGroup().location]",
  "properties": {
    "name": "[parameters('databaseAccountName')]",
    "databaseAccountOfferType": "[variables('offerType')]",
    "consistencyPolicy": {
      "defaultConsistencyLevel": "[parameters('consistencyLevel')]",
      "maxStalenessPrefix": "[parameters('maxStalenessPrefix')]",
      "maxIntervalInSeconds": "[parameters('maxIntervalInSeconds')]"
    }
  }
}
```

<em>Kind</em> takes the following values:  <em>GlobalDocumentDB</em>, <em>MongoDB</em> &amp; <em>Parse</em>.  It defines how the database engine is configured.  <strong>This property must be supplied at creation time and can’t be changed after</strong>.

<em>DefaultExperience</em> takes the following values:  <em>DocumentDB</em>, <em>MongoDB</em>,
<em>Graph</em> &amp; <em>Table</em>.  It influences only how the portal behaves.  <strong>This property is optional and can be changed in any update deployments.</strong>

When creating a Cosmos DB account in the Portal, here is the mapping of the values.  The left-hand side column <em>API</em> refers to the drop down value selected in the portal at the account creation.
<table border="3" width="524">
<thead>
<tr style="background:lightblue;">
<th>API</th>
<th>Kind</th>
<th>Default Experience</th>
</tr>
</thead>
<tbody>
<tr>
<td>SQL (DocumentDB)</td>
<td>GlobalDocumentDB</td>
<td>DocumentDB</td>
</tr>
<tr>
<td>MongoDB</td>
<td>MongoDB</td>
<td>MongoDB</td>
</tr>
<tr>
<td>Gremlin (graph)</td>
<td>GlobalDocumentDB</td>
<td>Graph</td>
</tr>
<tr>
<td>Table (key-value)</td>
<td>GlobalDocumentDB</td>
<td>Table</td>
</tr>
</tbody>
</table>
We notice the <em>Kind</em> value <em>Parse</em> isn’t yet used with any model.  It is used for the <a href="https://azuremarketplace.microsoft.com/en-us/marketplace/apps/Microsoft.ParseServer" target="_blank" rel="noopener">Parse Server offering</a>.
<h2>Changing the experience</h2>
With all that said, we can easily change the default experience from one ARM Deployment to another.  <a href="https://github.com/vplauzon/cosmos-db/tree/master/Cosmos-DB-Portal-Experience" target="_blank" rel="noopener">Template is available in GitHub</a>.

Also, since the experience is a simple tag, it can be changed using <em>PowerShell</em> or even the Portal.

<a href="/assets/posts/2017/3/hacking-changing-cosmos-db-portal-experience-from-graph-to-sql/image3.png"><img style="border:0 currentcolor;display:inline;background-image:none;" title="image" src="/assets/posts/2017/3/hacking-changing-cosmos-db-portal-experience-from-graph-to-sql/image_thumb3.png" alt="image" border="0" /></a>
<h2>Summary</h2>
Although the fundamental database engine is set at the creation of the account, the portal experience can be changed.

Therefore, if it is convenient to change the experience in order to execute some tasks, it is possible to do so without impacting the underlying database.