---
title:  Cosmos DB Configuration Management
date:  06/20/2018 10:30:46
permalink:  "/2018/06/20/cosmos-db-configuration-management/"
categories:
- Solution
tags:
- Automation
- Containers
- NoSQL
---
<a href="assets/2018/6/cosmos-db-configuration-management/black-board-bright-695266.jpg"><img style="border:0 currentcolor;float:right;display:inline;background-image:none;" title="black-board-bright-695266" src="assets/2018/6/cosmos-db-configuration-management/black-board-bright-695266_thumb.jpg" alt="black-board-bright-695266" width="320" height="213" align="right" border="0" /></a>I often found the need to automate Cosmos DB deployments.

I like to have users run an ARM template and be ready to go.  Automation is key component to repeatability.  It enables automated testing and increase agility in many other ways.

ARM Templates don’t go beyond a database account.

Take the article <a href="https://vincentlauzon.com/2017/11/01/setup-for-populating-cosmos-db-with-random-data-using-logic-apps/">Setup for populating Cosmos DB with random data using Logic Apps</a>.  On top of providing an ARM template, we needed to add bunch of steps in the Portal to setup Cosmos DB.

This is why I built <a href="https://github.com/vplauzon/cosmos-db-target-config">cosmos-db-target-config, available on GitHub</a>.  It mimics what a full blown ARM Template provider could do for Cosmos DB.
<h2>ARM Template limitations</h2>
<a href="https://docs.microsoft.com/en-ca/azure/templates/microsoft.documentdb/databaseaccounts">Cosmos DB’s ARM template provider</a> only deploys a database account.

Azure Command Line Interface (CLI) <a href="https://docs.microsoft.com/en-us/cli/azure/cosmosdb">goes further</a>.  We can script databases &amp; collections.  We can’t script anything beyond a collection (e.g. stored procedures &amp; functions).

The tool covering the entire Cosmos DB REST API is <a href="https://docs.microsoft.com/en-us/azure/cosmos-db/create-sql-api-dotnet">its SDK</a>.  It is available on several platforms, including .NET, Java, Python &amp; Node.js.
<h2>Enter Target Config</h2>
<a href="https://github.com/vplauzon/cosmos-db-target-config">Cosmos DB Target Config</a> works by reading a target config and applying it to a Cosmos DB Database Account.

It can create databases from scratch.  It can also evolve existing databases.  It is a target state system.

Cosmos DB Target Config takes the form of a <a href="https://github.com/vplauzon/cosmos-db-target-config/tree/master/CosmosTargetConsole">.NET Core Console Application</a>.  It can easily be used as a Container Instance in an ARM Template deployment.  We discussed this <a href="https://vincentlauzon.com/2018/06/13/using-azure-container-instances-to-complete-automation/">automation approach here</a>.

The Linux Container image is <a href="https://hub.docker.com/r/vplauzon/cosmos-db-target-config/">available on Docker Hub</a>.  It takes a Cosmos DB Account endpoint, access key and a target configuration file public URL.

We can use SAS token to make a private blob accessible.
<h2>Target Configuration</h2>
A Target Configuration file is a simple JSON file.  For instance:

[code language="JavaScript"]

{
   &quot;$schema&quot;: &quot;https://raw.githubusercontent.com/vplauzon/cosmos-db-target-config/master/documentation/cosmos-target-schema.json&quot;,
   &quot;destructiveFlags&quot;: [
     &quot;database&quot;,
     &quot;collection&quot;,
     &quot;storedProcedure&quot;
   ],
   &quot;databases&quot;: [
     {
       &quot;name&quot;: &quot;simple-db&quot;,
       &quot;collections&quot;: [
         {
           &quot;name&quot;: &quot;partitioned-with-sproc&quot;,
           &quot;partitionKey&quot;: &quot;/dept&quot;,
           &quot;requestUnits&quot;: 1200,
           &quot;storedProcedures&quot;: [
             {
               &quot;name&quot;: &quot;oneSproc&quot;,
               &quot;targetUrl&quot;: &quot;sproc1.js&quot;
             }
           ]
         }
       ]
     }
   ]
 }

[/code]

This specific file creates a database named <em>simple-db</em>.  It creates one collection in that database named <em>partitioned-with-sproc</em>.  It finally creates a stored procedure within that collection.  The file defines the throughput of the collection and its partition key.

At the beginning of the file we specify <em>destructiveFlags</em>.  Those define the type of resources Cosmos DB Target Config can delete.  By default, it will only add resources and won’t delete anything.
<h2>Trying it</h2>
Let’s give it a try.  Let’s deploy a sample by clicking the following button:

<a href="https://portal.azure.com/#create/Microsoft.Template/uri/https%3A%2F%2Fraw.githubusercontent.com%2Fvplauzon%2Fcosmos-db-target-config%2Fmaster%2FDeployment%2Fazuredeploy.json"><img style="border:0 currentcolor;display:inline;background-image:none;" title="image" src="http://azuredeploy.net/deploybutton.png" alt="image" border="0" /></a>

This should lead to the following Azure Portal pane:

<img src="https://vincentlauzon.files.wordpress.com/2018/06/image4.png" />

The only template parameter is the <em>Demo Target Config File</em>.  This allows us to choose a demo file.  Those files are all the <a href="https://github.com/vplauzon/cosmos-db-target-config/tree/master/Deployment/target-config">same folder on GitHub</a>.

Let’s start with the first one:  <em>Single Unpartitioned Collection</em>.

Deployment usually takes less than 5 minutes.  Once it’s completed, we should have the following resources in the resource group:

<a href="assets/2018/6/cosmos-db-configuration-management/image5.png"><img style="border:0 currentcolor;display:inline;background-image:none;" title="image" src="assets/2018/6/cosmos-db-configuration-management/image_thumb5.png" alt="image" border="0" /></a>

Let’s first look at the <em>Azure Cosmos DB account</em>.  The name of the resource is appended a unique string so it doesn’t clash with other accounts in Azure.

In the overview page of the account we can see the account isn’t empty but has a database with one collection.

<a href="assets/2018/6/cosmos-db-configuration-management/image6.png"><img style="border:0 currentcolor;display:inline;background-image:none;" title="image" src="assets/2018/6/cosmos-db-configuration-management/image_thumb6.png" alt="image" border="0" /></a>

In <em>Data Explorer</em>, we can see the collection has a stored procedure:

<a href="assets/2018/6/cosmos-db-configuration-management/image7.png"><img style="border:0 currentcolor;display:inline;background-image:none;" title="image" src="assets/2018/6/cosmos-db-configuration-management/image_thumb7.png" alt="image" border="0" /></a>

With only one ARM template we got everything deployed in Cosmos DB!
<h2>The magic:  Container Instance</h2>
Let’s look at how that happened.  Going back to the resource group, let’s pick the container group.  We’ll likely need to hit <em>Refresh</em> to see the logs.

<a href="assets/2018/6/cosmos-db-configuration-management/image8.png"><img style="border:0 currentcolor;display:inline;background-image:none;" title="image" src="assets/2018/6/cosmos-db-configuration-management/image_thumb8.png" alt="image" border="0" /></a>

The container first outputs the environment variables passed by the ARM Template.  The first two are credentials while the third is the target URL of the configuration file.

That target configuration content itself is then output.

If we scroll down, we can see the operations it did on the Cosmos DB account:

<a href="assets/2018/6/cosmos-db-configuration-management/image9.png"><img style="border:0 currentcolor;display:inline;background-image:none;" title="image" src="assets/2018/6/cosmos-db-configuration-management/image_thumb9.png" alt="image" border="0" /></a>
<h2>Update</h2>
Let’s now update a Cosmos DB account.

First, we’ll need to delete the container group.

<a href="assets/2018/6/cosmos-db-configuration-management/image10.png"><img style="border:0 currentcolor;display:inline;background-image:none;" title="image" src="assets/2018/6/cosmos-db-configuration-management/image_thumb10.png" alt="image" border="0" /></a>

We do this so that the ARM template can recreate a container group and run the new target configuration.  <u>This step is necessary</u> given how Container Instance work.

Now, let’s deploy again:

<a href="https://portal.azure.com/#create/Microsoft.Template/uri/https%3A%2F%2Fraw.githubusercontent.com%2Fvplauzon%2Fcosmos-db-target-config%2Fmaster%2FDeployment%2Fazuredeploy.json"><img style="border:0 currentcolor;display:inline;background-image:none;" title="image" src="http://azuredeploy.net/deploybutton.png" alt="image" border="0" /></a>

Let’s specify the same resource group so that we will update the same Cosmos DB account.

Let’s select <em>Single Partitioned Collection</em>.

<a href="assets/2018/6/cosmos-db-configuration-management/image11.png"><img style="border:0 currentcolor;display:inline;background-image:none;" title="image" src="assets/2018/6/cosmos-db-configuration-management/image_thumb11.png" alt="image" border="0" /></a>

After the deployment, we can see the previous database and its collection are gone.  They are replaced by another database and collection.

<a href="assets/2018/6/cosmos-db-configuration-management/image12.png"><img style="border:0 currentcolor;display:inline;background-image:none;" title="image" src="assets/2018/6/cosmos-db-configuration-management/image_thumb12.png" alt="image" border="0" /></a>

If we look at the logs of the container, we can see what occurred:

<a href="assets/2018/6/cosmos-db-configuration-management/image14.png"><img style="border:0 currentcolor;display:inline;background-image:none;" title="image" src="assets/2018/6/cosmos-db-configuration-management/image_thumb14.png" alt="image" border="0" /></a>

We can see that Cosmos DB Target Config behaves like an ARM Template.  It takes a Cosmos DB account from any state and brings it to the state described in configuration.

Here it
<ul>
 	<li>Kept the database in place</li>
 	<li>Removed a collection</li>
 	<li>Added another collection</li>
 	<li>Added a stored procedure</li>
</ul>
<h2>Container Group Configuration</h2>
We integrate cosmos-db-target-config with ARM template by using Azure Container Instance.  We pass parameters to the container as environment variables.

[code language="JavaScript"]

&quot;environmentVariables&quot;: [
  {
    &quot;name&quot;: &quot;ACCOUNT_ENDPOINT&quot;,
    &quot;value&quot;: &quot;[reference(variables('Account Id')).documentEndpoint]&quot;
  },
  {
    &quot;name&quot;: &quot;ACCOUNT_KEY&quot;,
    &quot;value&quot;: &quot;[listKeys(variables('Account Id'), '2015-04-08').primaryMasterKey]&quot;
  },
  {
    &quot;name&quot;: &quot;TARGET_URL&quot;,
    &quot;value&quot;: &quot;[variables('Target URL')]&quot;
  }
]

[/code]

The first two parameters are credentials to access Cosmos DB Account.  They do not need to be hardcoded.  They can be inferred by as we did here, pointing to the Cosmos DB Account resource.  The last variable is the target URL.
<h2>Learning more</h2>
cosmos-db-target-config is <a href="https://github.com/vplauzon/cosmos-db-target-config">open sourced on GitHub</a>.  This is where its documentation lives.
<h2>Summary</h2>
We presented cosmos-db-target-config.

Hopefully this could be useful to people using Cosmos DB.

Feel free to leave feedback about it.