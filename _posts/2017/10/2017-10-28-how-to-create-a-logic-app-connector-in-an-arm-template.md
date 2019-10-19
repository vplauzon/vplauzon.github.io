---
title:  How to Create a Logic App Connector in an ARM Template
date:  2017-10-28 19:25:50 -04:00
permalink:  "/2017/10/28/how-to-create-a-logic-app-connector-in-an-arm-template/"
categories:
- Solution
tags:
- Automation
- NoSQL
- Serverless
---
<a href="assets/2017/10/how-to-create-a-logic-app-connector-in-an-arm-template/pexels-photo-4150431.jpg"><img style="border:0 currentcolor;float:right;display:inline;background-image:none;" title="pexels-photo-415043[1]" src="assets/2017/10/how-to-create-a-logic-app-connector-in-an-arm-template/pexels-photo-4150431_thumb.jpg" alt="pexels-photo-415043[1]" width="320" height="213" align="right" border="0" /></a>I wanted to automate the performance test setup we discussed in the <a href="https://vincentlauzon.com/2017/10/25/cosmos-db-performance-with-geospatial-data/">last article</a>.  This includes a Logic App calling into a Cosmos DB stored procedure.

Logic App uses <a href="https://docs.microsoft.com/en-ca/azure/connectors/apis-list" target="_blank" rel="noopener">connectors</a> when connecting to other services, either within or outside of Azure.  Now how do we create those in an ARM Template?  This problem is the same regardless if we want to connect to Cosmos DB, Blob Storage, an FTP site, SalesForce.com, Twitter, etc.  .

<h2>The problem</h2>

There is no schema definition of those as of this date (late October 2017).  If we using the “Automation Script” tab in the portal to reverse engineer the ARM template, it doesn’t quite work:  we can create the connection, but no provide the Cosmos DB credentials.  Using the Resource Explorer in the Portal gives a different yet still non-usable picture.

<h2>Solution</h2>

I reached out and found guidance from the very enthusiastic &amp; helpful <a href="https://hollan.io/" target="_blank" rel="noopener">Jeff Hollan</a>.

The guidance is quite simple yet very powerful since it will solve the problem for most connectors.

Basically:  use Visual Studio tools for Logic Apps, do the connection there and the tool will create the ARM template for us.

The tools are available for <a href="https://marketplace.visualstudio.com/items?itemName=VinaySinghMSFT.AzureLogicAppsToolsforVisualStudio-18551" target="_blank" rel="noopener">Visual Studio 2017</a> and <a href="https://visualstudiogallery.msdn.microsoft.com/e25ad307-46cf-412e-8ba5-5b555d53d2d9/view/Reviews" target="_blank" rel="noopener">Visual Studio 2015</a>.

<h2>Specifically for Cosmos DB</h2>

I did navigate the web before finding an answer and I saw a lot of dead ends out there, so if you are looking specifically for Cosmos DB connector, here it is:

[code language="JavaScript"]

{
  &quot;apiVersion&quot;: &quot;2016-06-01&quot;,
  &quot;type&quot;: &quot;Microsoft.Web/connections&quot;,
  &quot;name&quot;: &quot;connector-resource-name-here&quot;,
  &quot;location&quot;: &quot;[resourceGroup().location]&quot;,
  &quot;properties&quot;: {
    &quot;displayName&quot;: &quot;[concat('Connection to Cosmos DB account \&quot;', parameters('Cosmos DB Account Name'), '\&quot;')]&quot;,
    &quot;api&quot;: {
      &quot;id&quot;: &quot;[concat(subscription().id, '/providers/Microsoft.Web/locations/', resourceGroup().location, '/managedApis/documentdb')]&quot;
    },
    &quot;parameterValues&quot;: {
      &quot;databaseAccount&quot;: &quot;[parameters('Cosmos DB Account Name')]&quot;,
      &quot;accessKey&quot;: &quot;[listKeys(resourceId('Microsoft.DocumentDB/databaseAccounts', parameters('Cosmos DB Account Name')), '2015-04-08').primaryMasterKey]&quot;
    }
  },
  &quot;dependsOn&quot;: [
    &quot;[resourceId('Microsoft.DocumentDB/databaseAccounts', parameters('Cosmos DB Account Name'))]&quot;
  ]
}

[/code]

Notice that we hook on a Cosmos DB account in order to list its keys.  We assume the Cosmos DB account is part of the same deployment.

We could also simply hard code the primary or secondary key right there if the resource isn’t ours.

<h2>Summary</h2>

I hope this is useful for some out there as this had me banging my head on the wall for a few hours.