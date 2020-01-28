---
title: Azure SQL Elastic Pool - ARM Templates
date: 2016-12-21 16:00:10 -08:00
permalink: /2016/12/21/azure-sql-elastic-pool-arm-templates/
categories:
- Solution
tags:
- Automation
- Data
---
<a href="/assets/posts/2016/4/azure-sql-elastic-pool-arm-templates/coil-632650_6401.jpg"><img style="background-image:none;float:right;padding-top:0;padding-left:0;display:inline;padding-right:0;border-width:0;" title="coil-632650_640[1]" src="/assets/posts/2016/4/azure-sql-elastic-pool-arm-templates/coil-632650_6401_thumb.jpg" alt="coil-632650_640[1]" width="380" height="253" align="right" border="0" /></a>In my <a href="https://vincentlauzon.com/2016/12/18/azure-sql-elastic-pool-overview/">last article</a>, I covered Azure SQL Elastic Pool.  In this one I cover how to provision it using ARM templates.

As of today (December 2016), the documentation about Azure SQL Elastic Pool provisioning via ARM templates is…  <a href="https://docs.microsoft.com/en-us/azure/sql-database/sql-database-elastic-pool-create-portal" target="_blank">not existing</a>.

Searching for it I was able to gather hints via a few colleagues GitHub repos, but there are no examples in the <a href="https://azure.microsoft.com/en-us/resources/templates/" target="_blank">ARM quickstart templates</a> nor is the <a href="https://azure.microsoft.com/en-us/resources/templates/" target="_blank">elastic pool resource schema documented</a>.  Also, the <em>Automation Script</em> feature in the portal doesn't reverse engineer an ARM template for the elastic pool.

So I hope this article fills that gap and is easy to search for &amp; consume.
<h2>ARM Template</h2>
Here we’re going to provision a Server with two pools, <em>Pool-A</em> &amp; <em>Pool-B</em> (yeah, sounds a bit like <a href="http://seuss.wikia.com/wiki/Thing_One_and_Thing_Two" target="_blank">Thing 1 &amp; Thing 2</a>), each having a few (configurable number of) databases in them.

```javascript

{
  "$schema": "https://schema.management.azure.com/schemas/2015-01-01/deploymentTemplate.json#",
  "contentVersion": "1.0.0.0",
  "parameters": {
    "Server Name": {
      "defaultValue": "pooldemoserver",
      "type": "string",
      "metadata": {
        "description": "Name of the SQL:  needs to be unique among all servers in Azure"
      }
    },
    "Admin Login": {
      "defaultValue": "myadmin",
      "type": "string",
      "metadata": {
        "description": "SQL Server Admin login name"
      }
    },
    "Admin Password": {
      "type": "securestring",
      "metadata": {
        "description": "SQL Server Admin login password"
      }
    },
    "Pool A Edition": {
      "defaultValue": "Standard",
      "type": "string",
      "allowedValues": [
        "Basic",
        "Standard",
        "Premium"
      ],
      "metadata": {
        "description": "Pool A Edition"
      }
    },
    "Pool B Edition": {
      "defaultValue": "Standard",
      "type": "string",
      "allowedValues": [
        "Basic",
        "Standard",
        "Premium"
      ],
      "metadata": {
        "description": "Pool B Edition"
      }
    },
    "DB Max Size": {
      "defaultValue": "10737418240",
      "type": "string",
      "allowedValues": [
        "104857600",
        "524288000",
        "1073741824",
        "2147483648",
        "5368709120",
        "10737418240",
        "21474836480",
        "32212254720",
        "42949672960",
        "53687091200",
        "107374182400",
        "161061273600",
        "214748364800",
        "268435456000",
        "322122547200",
        "429496729600",
        "536870912000"
      ],
      "metadata": {
        "description": "DB Max Size, in bytes"
      }
    }
  },
  "variables": {
    "Pool A": "Pool-A",
    "Pool B": "Pool-B",
    "DB A Prefix": "Pool-A-Db",
    "DB B Prefix": "Pool-B-Db",
    "Count A": 2,
    "Count B": 4
  },
  "resources": [
    {
      "name": "[parameters('Server Name')]",
      "type": "Microsoft.Sql/servers",
      "apiVersion": "2014-04-01-preview",
      "location": "[resourceGroup().location]",
      "dependsOn": [],
      "properties": {
        "administratorLogin": "[parameters('Admin Login')]",
        "administratorLoginPassword": "[parameters('Admin Password')]",
        "version": "12.0"
      },
      "resources": [
        {
          "type": "firewallRules",
          "kind": "v12.0",
          "name": "AllowAllAzureIps",
          "apiVersion": "2014-04-01-preview",
          "location": "[resourceGroup().location]",
          "dependsOn": [
            "[resourceId('Microsoft.Sql/servers', parameters('Server Name'))]"
          ],
          "properties": {
            "startIpAddress": "0.0.0.0",
            "endIpAddress": "0.0.0.0"
          }
        },
        {
          "type": "elasticpools",
          "name": "[variables('Pool A')]",
          "apiVersion": "2014-04-01-preview",
          "location": "[resourceGroup().location]",
          "dependsOn": [
            "[resourceId('Microsoft.Sql/servers', parameters('Server Name'))]"
          ],
          "properties": {
            "edition": "[parameters('Pool A Edition')]",
            "dtu": "200",
            "databaseDtuMin": "10",
            "databaseDtuMax": "50"
          }
        },
        {
          "type": "elasticpools",
          "name": "[variables('Pool B')]",
          "apiVersion": "2014-04-01-preview",
          "location": "[resourceGroup().location]",
          "dependsOn": [
            "[resourceId('Microsoft.Sql/servers', parameters('Server Name'))]"
          ],
          "properties": {
            "edition": "[parameters('Pool B Edition')]",
            "dtu": "400",
            "databaseDtuMin": "0",
            "databaseDtuMax": null
          }
        }
      ]
    },
    {
      "type": "Microsoft.Sql/servers/databases",
      "copy": {
        "name": "DBs-A",
        "count": "[variables('Count A')]"
      },
      "name": "[concat(parameters('Server Name'), '/', variables('DB A Prefix'), copyIndex())]",
      "location": "[resourceGroup().location]",
      "dependsOn": [
        "[resourceId('Microsoft.Sql/servers', parameters('Server Name'))]",
        "[resourceId('Microsoft.Sql/servers/elasticpools', parameters('Server Name'), variables('Pool A'))]"
      ],
      "tags": {
        "displayName": "Pool-A DBs"
      },
      "apiVersion": "2014-04-01-preview",
      "properties": {
        "collation": "SQL_Latin1_General_CP1_CI_AS",
        "maxSizeBytes": "[parameters('DB Max Size')]",
        "requestedServiceObjectiveName": "ElasticPool",
        "elasticPoolName": "[variables('Pool A')]"
      }
    },
    {
      "type": "Microsoft.Sql/servers/databases",
      "copy": {
        "name": "DBs-B",
        "count": "[variables('Count B')]"
      },
      "name": "[concat(parameters('Server Name'), '/', variables('DB B Prefix'), copyIndex())]",
      "location": "[resourceGroup().location]",
      "dependsOn": [
        "[resourceId('Microsoft.Sql/servers', parameters('Server Name'))]",
        "[resourceId('Microsoft.Sql/servers/elasticpools', parameters('Server Name'), variables('Pool B'))]"
      ],
      "tags": {
        "displayName": "Pool-B DBs"
      },
      "apiVersion": "2014-04-01-preview",
      "properties": {
        "edition": "[parameters('Pool B Edition')]",
        "collation": "SQL_Latin1_General_CP1_CI_AS",
        "maxSizeBytes": "[parameters('DB Max Size')]",
        "requestedServiceObjectiveName": "ElasticPool",
        "elasticPoolName": "[variables('Pool B')]"
      }
    }
  ]
}
```

We can deploy the template as is.  We’ll need to enter at least an Admin password (for the Azure SQL server).

The “Server Name” parameter must be unique throughout Azure (not just your subscription).  So if it happens to be taken when you try to deploy the template (in which case you would receive an error message around <span style="color:#ff0000;">Server 'pooldemoserver' is busy with another operation</span>), try a new, more original name.

Each parameter is documented in the metadata description.
<h2>Results</h2>
Let’s look at the result.  Let’s first go in the resource group where we deployed the template.

In the resource list we should see the following:

<a href="/assets/posts/2016/4/azure-sql-elastic-pool-arm-templates/image13.png"><img style="background-image:none;float:none;padding-top:0;padding-left:0;margin-left:auto;display:block;padding-right:0;margin-right:auto;border-width:0;" title="image" src="/assets/posts/2016/4/azure-sql-elastic-pool-arm-templates/image_thumb13.png" alt="image" width="640" height="379" border="0" /></a>

We first have our server, with default name <em>pooldemoserver</em>, our two pools, <em>Pool-A</em> &amp; <em>Pool-B</em>, and 6 databases.

Let’s select <em>Pool-A</em>.

<a href="/assets/posts/2016/4/azure-sql-elastic-pool-arm-templates/image14.png"><img style="background-image:none;float:none;padding-top:0;padding-left:0;margin-left:auto;display:block;padding-right:0;margin-right:auto;border-width:0;" title="image" src="/assets/posts/2016/4/azure-sql-elastic-pool-arm-templates/image_thumb14.png" alt="image" width="640" height="339" border="0" /></a>

We can see the pool is of <em>Standard</em> edition, has 200 eDTUs with a minimum of 10 eDTUs and maximum 50 per databases, which is faithful to its ARM definition (line 10-13).

```javascript

        {
          "type": "elasticpools",
          "name": "[variables('Pool A')]",
          "apiVersion": "2014-04-01-preview",
          "location": "[resourceGroup().location]",
          "dependsOn": [
            "[resourceId('Microsoft.Sql/servers', parameters('Server Name'))]"
          ],
          "properties": {
            "edition": "[parameters('Pool A Edition')]",
            "dtu": "200",
            "databaseDtuMin": "10",
            "databaseDtuMax": "50"
          }
        }
```

Similarly, <em>Pool-B</em> has a minimum of 0 and a maximum of 100.  The maximum was set to <em>null</em> in the template and hence is the maximum allowed for a <a href="https://docs.microsoft.com/en-us/azure/sql-database/sql-database-resource-limits#service-tiers-and-performance-levels" target="_blank">standard pool of 400 DTUs</a>.

Let’s select the databases in <em>Pool-B</em>.  Alternatively, we can select the <em>Configure pool</em> tool bar option.

<a href="/assets/posts/2016/4/azure-sql-elastic-pool-arm-templates/image15.png"><img style="background-image:none;float:none;padding-top:0;padding-left:0;margin-left:auto;display:block;padding-right:0;margin-right:auto;border:0;" title="image" src="/assets/posts/2016/4/azure-sql-elastic-pool-arm-templates/image_thumb15.png" alt="image" width="640" height="315" border="0" /></a>

The following pane shows us the eDTUs consumed in the last 14 days.  It also allows us to change the assigned eDTUs to the pool.

It is in this pane that we can add / remove databases from the pool.

<a href="/assets/posts/2016/4/azure-sql-elastic-pool-arm-templates/image16.png"><img style="background-image:none;float:none;padding-top:0;padding-left:0;margin-left:auto;display:block;padding-right:0;margin-right:auto;border:0;" title="image" src="/assets/posts/2016/4/azure-sql-elastic-pool-arm-templates/image_thumb16.png" alt="image" width="640" height="90" border="0" /></a>

In order to remove databases from the pool, they must first be selected in the lower right pane corner.  We will have to chose a standalone pricing tier for each DB and hit save.  As of today (December 2016), there are no way to <em>move</em> databases from one pool to another directly, i.e. they must first be converted as a stand alone.  It is possible to move databases from a pool to another using PowerShell as I’ll demonstrate in a future article though.

If we go back to the resource group and select any of the database, we have a link to its parent pool.

<a href="/assets/posts/2016/4/azure-sql-elastic-pool-arm-templates/image17.png"><img style="background-image:none;float:none;padding-top:0;padding-left:0;margin-left:auto;display:block;padding-right:0;margin-right:auto;border:0;" title="image" src="/assets/posts/2016/4/azure-sql-elastic-pool-arm-templates/image_thumb17.png" alt="image" width="640" height="306" border="0" /></a>
<h2>Summary</h2>
Despite the current lack (as of December 2016) of documentation around it, it is quite possible to create databases within an elastic pool using ARM templates as we’ve demonstrated here.