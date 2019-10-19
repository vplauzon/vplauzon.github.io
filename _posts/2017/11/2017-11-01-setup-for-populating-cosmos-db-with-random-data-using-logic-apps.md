---
title: Setup for populating Cosmos DB with random data using Logic Apps
date: 2017-11-01 12:00:22 -04:00
permalink: /2017/11/01/setup-for-populating-cosmos-db-with-random-data-using-logic-apps/
categories:
- Solution
tags:
- Automation
- Data
- Integration
- NoSQL
- Serverless
---
<a href="/assets/2017/11/setup-for-populating-cosmos-db-with-random-data-using-logic-apps/pexels-photo-2679681.jpg"><img style="border:0 currentcolor;float:left;display:inline;background-image:none;" title="pexels-photo-267968[1]" src="/assets/2017/11/setup-for-populating-cosmos-db-with-random-data-using-logic-apps/pexels-photo-2679681_thumb.jpg" alt="pexels-photo-267968[1]" width="320" height="180" align="left" border="0" /></a>We recently published an article about <a href="https://vincentlauzon.com/2017/10/25/cosmos-db-performance-with-geospatial-data/">Cosmos DB Performance with Geospatial Data</a>.

In this article, we’re going to explain how to setup the environment in order to run those performance test.

More importantly, we believe this article is interesting on its own as it shows how to use Logic Apps to populate a Cosmos DB collection with random data in a very efficient way.

For this we will use a stored procedure as <a href="https://vincentlauzon.com/2017/10/19/invoking-a-stored-procedure-from-a-partitioned-cosmosdb-collection-from-logic-apps/">we explored in a past article</a>.

The ARM Template is <a href="https://github.com/vplauzon/cosmos-db/tree/master/Cosmos-DB-Geo-Perf/DeployPerfCosmosDB" target="_blank" rel="noopener">available on GitHub</a>.

<h2>Azure Resources</h2>

We want to create three main Azure Resources:

<ul>
    <li>Cosmos DB Account</li>
    <li>Cosmos DB Connector (for Logic Apps)</li>
    <li>Logic App</li>
</ul>

We will also need to create artefacts within the Cosmos DB account.  Namely:

<ul>
    <li>A Collection</li>
    <li>Modifying the Index Policy on the collection</li>
    <li>A Stored Procedure within the collection</li>
</ul>

<h2>ARM Template Deployment</h2>

Let’s create the Azure resource using the <a href="https://github.com/vplauzon/cosmos-db/tree/master/Cosmos-DB-Geo-Perf/DeployPerfCosmosDB" target="_blank" rel="noopener">ARM template deployment available on GitHub</a> (see deployment buttons at the bottom of the page).

The template has four parameters.  The first one is mandatory, the other three have default values:

<ul>
    <li>Cosmos DB Account Name:  Name of the Cosmos DB Account Azure resource ; this must be unique within all Cosmos DB Account in Azure (not only ours)</li>
    <li>Partition Count:  The number of partitions we’re going to seed data into (default is 4000)</li>
    <li>Records per partition:  Number of records (documents) we’re going to seed per partition (default is 300)</li>
    <li>Geo Ratio:  The ratio of documents which will have a geospatial location in them (default is .33, hence %33)</li>
</ul>

If we leave the default as is, we’ll have 4000 x 300 = 1.2 million documents, with a third of them (i.e. 400 000) with geospatial locations.  This corresponds to what we used for <a href="https://vincentlauzon.com/2017/10/25/cosmos-db-performance-with-geospatial-data/">performance test</a>.

<h2>Creating a Collection</h2>

Unfortunately, the Cosmos DB resource provider doesn’t expose sub components in the ARM model.  So we can’t create the collection within the ARM template.

We could use the <a href="https://docs.microsoft.com/en-us/cli/azure/cosmosdb?view=azure-cli-latest" target="_blank" rel="noopener">Command Line Interface (CLI) for Cosmos DB</a>.  Here we will use the Portal.

Let’s open the Cosmos DB Account resource created by the ARM template.

Let’s go to the Data Explorer tab.

<a href="/assets/2017/11/setup-for-populating-cosmos-db-with-random-data-using-logic-apps/image8.png"><img style="border:0 currentcolor;display:inline;background-image:none;" title="image" src="/assets/2017/11/setup-for-populating-cosmos-db-with-random-data-using-logic-apps/image_thumb8.png" alt="image" border="0" /></a>

Let’s then select <em>New Collection</em> and fill the form this way:

<a href="/assets/2017/11/setup-for-populating-cosmos-db-with-random-data-using-logic-apps/image9.png"><img style="border:0 currentcolor;display:inline;background-image:none;" title="image" src="/assets/2017/11/setup-for-populating-cosmos-db-with-random-data-using-logic-apps/image_thumb9.png" alt="image" border="0" /></a>

There are a few important fields in there:

<ul>
    <li>The database and collection name are hardcoded in the Logic App when invoking the stored procedure, so it is important to get them right</li>
    <li>Using the <em>Unlimited </em>storage capacity gives us a partitioned collection which is what we want for performance scale</li>
    <li>We initialize the throughput at 2500 RUs but we’ll change it for loading the data</li>
    <li>Partition key is “part”</li>
</ul>

<h2>Modifying Index Policy</h2>

While still being in the <em>Data Explorer</em>, let’s select the <em>Scale &amp; Settings</em> of our collection:

<a href="/assets/2017/11/setup-for-populating-cosmos-db-with-random-data-using-logic-apps/image10.png"><img style="border:0 currentcolor;display:inline;background-image:none;" title="image" src="/assets/2017/11/setup-for-populating-cosmos-db-with-random-data-using-logic-apps/image_thumb10.png" alt="image" border="0" /></a>

At the bottom of the pane, let’s edit the Indexing Policy:

<a href="/assets/2017/11/setup-for-populating-cosmos-db-with-random-data-using-logic-apps/image11.png"><img style="border:0 currentcolor;display:inline;background-image:none;" title="image" src="/assets/2017/11/setup-for-populating-cosmos-db-with-random-data-using-logic-apps/image_thumb11.png" alt="image" border="0" /></a>

Geospatial data isn’t indexed by default.  We therefore need to add at least the “Point” data type for indexing.

The procedure is explained in the <a href="https://docs.microsoft.com/en-us/azure/cosmos-db/geospatial#indexing" target="_blank" rel="noopener">public documentation</a>.

It is important to do this before loading the data so the data is indexed on load instead of asynchronously indexed after a change of policy.

<h2>Creating Stored Procedure</h2>

While still being in the <em>Data Explorer</em>, let’s select <em>New Stored Procedure</em>:

<a href="/assets/2017/11/setup-for-populating-cosmos-db-with-random-data-using-logic-apps/image12.png"><img style="border:0 currentcolor;display:inline;background-image:none;" title="image" src="/assets/2017/11/setup-for-populating-cosmos-db-with-random-data-using-logic-apps/image_thumb12.png" alt="image" border="0" /></a>

Let’s enter <em>createRecords</em> as <em>Stored Procedure Id</em>.

For the body, let’s copy-paste the content of the <a href="https://github.com/vplauzon/cosmos-db/blob/master/Cosmos-DB-Geo-Perf/PerfTest/CreateRecords.js" target="_blank" rel="noopener">CreateRecords.js</a>.

Click <em>Save</em>.

<h2>Increase RUs</h2>

Before going into the Logic App, let’s beef up the Request Units (RUs) of our collection.

<a href="/assets/2017/11/setup-for-populating-cosmos-db-with-random-data-using-logic-apps/image14.png"><img style="border:0 currentcolor;display:inline;background-image:none;" title="image" src="/assets/2017/11/setup-for-populating-cosmos-db-with-random-data-using-logic-apps/image_thumb14.png" alt="image" border="0" /></a>

We suggest boosting it to the maximum, i.e. 100 000.

Then click <em>Save</em>.

<h2>Executing the Logic Apps</h2>

Let’s open the Logic App in the same Azure Resource Group.

<a href="/assets/2017/11/setup-for-populating-cosmos-db-with-random-data-using-logic-apps/image13.png"><img style="border:0 currentcolor;display:inline;background-image:none;" title="image" src="/assets/2017/11/setup-for-populating-cosmos-db-with-random-data-using-logic-apps/image_thumb13.png" alt="image" border="0" /></a>

The whole point for using Logic Apps here is to have a component that will invoke Cosmos DB stored procedures in parallel in a reliable fashion.

Let’s click on <em>Run Trigger</em> and then <em>manual</em> (in the sub menu).

<a href="/assets/2017/11/setup-for-populating-cosmos-db-with-random-data-using-logic-apps/image16.png"><img style="border:0 currentcolor;display:inline;background-image:none;" title="image" src="/assets/2017/11/setup-for-populating-cosmos-db-with-random-data-using-logic-apps/image_thumb16.png" alt="image" border="0" /></a>

A run calls the stored procedures 4000 times and take about 5-6 minutes to do so.

<h2>Reduce RUs</h2>

Do not forget to scale the collection back.  The scale is the main driver for the cost of a collection.

<h2>Summary</h2>

Loading random data quickly in a Cosmos DB is best done by leveraging stored procedure as they run close to the data and can create documents very quickly.

Stored procedures run within a partition.  So we also need something to loop among partition and this is what Logic Apps does here.

Logic App is also very cost effective since it is a server-less resource which incur costs only when used.