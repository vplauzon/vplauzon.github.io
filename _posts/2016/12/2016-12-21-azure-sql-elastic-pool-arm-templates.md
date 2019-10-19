---
title:  Azure SQL Elastic Pool - ARM Templates
date:  2016-12-21 19:00:10 -05:00
permalink:  "/2016/12/21/azure-sql-elastic-pool-arm-templates/"
categories:
- Solution
tags:
- Automation
- Data
---
<a href="http://vincentlauzon.files.wordpress.com/2016/12/coil-632650_6401.jpg"><img style="background-image:none;float:right;padding-top:0;padding-left:0;display:inline;padding-right:0;border-width:0;" title="coil-632650_640[1]" src="http://vincentlauzon.files.wordpress.com/2016/12/coil-632650_6401_thumb.jpg" alt="coil-632650_640[1]" width="380" height="253" align="right" border="0" /></a>In my <a href="https://vincentlauzon.com/2016/12/18/azure-sql-elastic-pool-overview/">last article</a>, I covered Azure SQL Elastic Pool.  In this one I cover how to provision it using ARM templates.

As of today (December 2016), the documentation about Azure SQL Elastic Pool provisioning via ARM templates is…  <a href="https://docs.microsoft.com/en-us/azure/sql-database/sql-database-elastic-pool-create-portal" target="_blank">not existing</a>.

Searching for it I was able to gather hints via a few colleagues GitHub repos, but there are no examples in the <a href="https://azure.microsoft.com/en-us/resources/templates/" target="_blank">ARM quickstart templates</a> nor is the <a href="https://azure.microsoft.com/en-us/resources/templates/" target="_blank">elastic pool resource schema documented</a>.  Also, the <em>Automation Script</em> feature in the portal doesn't reverse engineer an ARM template for the elastic pool.

So I hope this article fills that gap and is easy to search for &amp; consume.
<h2>ARM Template</h2>
Here we’re going to provision a Server with two pools, <em>Pool-A</em> &amp; <em>Pool-B</em> (yeah, sounds a bit like <a href="http://seuss.wikia.com/wiki/Thing_One_and_Thing_Two" target="_blank">Thing 1 &amp; Thing 2</a>), each having a few (configurable number of) databases in them.

[code language="javascript"]
{
  &quot;$schema&quot;: &quot;https://schema.management.azure.com/schemas/2015-01-01/deploymentTemplate.json#&quot;,
  &quot;contentVersion&quot;: &quot;1.0.0.0&quot;,
  &quot;parameters&quot;: {
    &quot;Server Name&quot;: {
      &quot;defaultValue&quot;: &quot;pooldemoserver&quot;,
      &quot;type&quot;: &quot;string&quot;,
      &quot;metadata&quot;: {
        &quot;description&quot;: &quot;Name of the SQL:  needs to be unique among all servers in Azure&quot;
      }
    },
    &quot;Admin Login&quot;: {
      &quot;defaultValue&quot;: &quot;myadmin&quot;,
      &quot;type&quot;: &quot;string&quot;,
      &quot;metadata&quot;: {
        &quot;description&quot;: &quot;SQL Server Admin login name&quot;
      }
    },
    &quot;Admin Password&quot;: {
      &quot;type&quot;: &quot;securestring&quot;,
      &quot;metadata&quot;: {
        &quot;description&quot;: &quot;SQL Server Admin login password&quot;
      }
    },
    &quot;Pool A Edition&quot;: {
      &quot;defaultValue&quot;: &quot;Standard&quot;,
      &quot;type&quot;: &quot;string&quot;,
      &quot;allowedValues&quot;: [
        &quot;Basic&quot;,
        &quot;Standard&quot;,
        &quot;Premium&quot;
      ],
      &quot;metadata&quot;: {
        &quot;description&quot;: &quot;Pool A Edition&quot;
      }
    },
    &quot;Pool B Edition&quot;: {
      &quot;defaultValue&quot;: &quot;Standard&quot;,
      &quot;type&quot;: &quot;string&quot;,
      &quot;allowedValues&quot;: [
        &quot;Basic&quot;,
        &quot;Standard&quot;,
        &quot;Premium&quot;
      ],
      &quot;metadata&quot;: {
        &quot;description&quot;: &quot;Pool B Edition&quot;
      }
    },
    &quot;DB Max Size&quot;: {
      &quot;defaultValue&quot;: &quot;10737418240&quot;,
      &quot;type&quot;: &quot;string&quot;,
      &quot;allowedValues&quot;: [
        &quot;104857600&quot;,
        &quot;524288000&quot;,
        &quot;1073741824&quot;,
        &quot;2147483648&quot;,
        &quot;5368709120&quot;,
        &quot;10737418240&quot;,
        &quot;21474836480&quot;,
        &quot;32212254720&quot;,
        &quot;42949672960&quot;,
        &quot;53687091200&quot;,
        &quot;107374182400&quot;,
        &quot;161061273600&quot;,
        &quot;214748364800&quot;,
        &quot;268435456000&quot;,
        &quot;322122547200&quot;,
        &quot;429496729600&quot;,
        &quot;536870912000&quot;
      ],
      &quot;metadata&quot;: {
        &quot;description&quot;: &quot;DB Max Size, in bytes&quot;
      }
    }
  },
  &quot;variables&quot;: {
    &quot;Pool A&quot;: &quot;Pool-A&quot;,
    &quot;Pool B&quot;: &quot;Pool-B&quot;,
    &quot;DB A Prefix&quot;: &quot;Pool-A-Db&quot;,
    &quot;DB B Prefix&quot;: &quot;Pool-B-Db&quot;,
    &quot;Count A&quot;: 2,
    &quot;Count B&quot;: 4
  },
  &quot;resources&quot;: [
    {
      &quot;name&quot;: &quot;[parameters('Server Name')]&quot;,
      &quot;type&quot;: &quot;Microsoft.Sql/servers&quot;,
      &quot;apiVersion&quot;: &quot;2014-04-01-preview&quot;,
      &quot;location&quot;: &quot;[resourceGroup().location]&quot;,
      &quot;dependsOn&quot;: [],
      &quot;properties&quot;: {
        &quot;administratorLogin&quot;: &quot;[parameters('Admin Login')]&quot;,
        &quot;administratorLoginPassword&quot;: &quot;[parameters('Admin Password')]&quot;,
        &quot;version&quot;: &quot;12.0&quot;
      },
      &quot;resources&quot;: [
        {
          &quot;type&quot;: &quot;firewallRules&quot;,
          &quot;kind&quot;: &quot;v12.0&quot;,
          &quot;name&quot;: &quot;AllowAllAzureIps&quot;,
          &quot;apiVersion&quot;: &quot;2014-04-01-preview&quot;,
          &quot;location&quot;: &quot;[resourceGroup().location]&quot;,
          &quot;dependsOn&quot;: [
            &quot;[resourceId('Microsoft.Sql/servers', parameters('Server Name'))]&quot;
          ],
          &quot;properties&quot;: {
            &quot;startIpAddress&quot;: &quot;0.0.0.0&quot;,
            &quot;endIpAddress&quot;: &quot;0.0.0.0&quot;
          }
        },
        {
          &quot;type&quot;: &quot;elasticpools&quot;,
          &quot;name&quot;: &quot;[variables('Pool A')]&quot;,
          &quot;apiVersion&quot;: &quot;2014-04-01-preview&quot;,
          &quot;location&quot;: &quot;[resourceGroup().location]&quot;,
          &quot;dependsOn&quot;: [
            &quot;[resourceId('Microsoft.Sql/servers', parameters('Server Name'))]&quot;
          ],
          &quot;properties&quot;: {
            &quot;edition&quot;: &quot;[parameters('Pool A Edition')]&quot;,
            &quot;dtu&quot;: &quot;200&quot;,
            &quot;databaseDtuMin&quot;: &quot;10&quot;,
            &quot;databaseDtuMax&quot;: &quot;50&quot;
          }
        },
        {
          &quot;type&quot;: &quot;elasticpools&quot;,
          &quot;name&quot;: &quot;[variables('Pool B')]&quot;,
          &quot;apiVersion&quot;: &quot;2014-04-01-preview&quot;,
          &quot;location&quot;: &quot;[resourceGroup().location]&quot;,
          &quot;dependsOn&quot;: [
            &quot;[resourceId('Microsoft.Sql/servers', parameters('Server Name'))]&quot;
          ],
          &quot;properties&quot;: {
            &quot;edition&quot;: &quot;[parameters('Pool B Edition')]&quot;,
            &quot;dtu&quot;: &quot;400&quot;,
            &quot;databaseDtuMin&quot;: &quot;0&quot;,
            &quot;databaseDtuMax&quot;: null
          }
        }
      ]
    },
    {
      &quot;type&quot;: &quot;Microsoft.Sql/servers/databases&quot;,
      &quot;copy&quot;: {
        &quot;name&quot;: &quot;DBs-A&quot;,
        &quot;count&quot;: &quot;[variables('Count A')]&quot;
      },
      &quot;name&quot;: &quot;[concat(parameters('Server Name'), '/', variables('DB A Prefix'), copyIndex())]&quot;,
      &quot;location&quot;: &quot;[resourceGroup().location]&quot;,
      &quot;dependsOn&quot;: [
        &quot;[resourceId('Microsoft.Sql/servers', parameters('Server Name'))]&quot;,
        &quot;[resourceId('Microsoft.Sql/servers/elasticpools', parameters('Server Name'), variables('Pool A'))]&quot;
      ],
      &quot;tags&quot;: {
        &quot;displayName&quot;: &quot;Pool-A DBs&quot;
      },
      &quot;apiVersion&quot;: &quot;2014-04-01-preview&quot;,
      &quot;properties&quot;: {
        &quot;collation&quot;: &quot;SQL_Latin1_General_CP1_CI_AS&quot;,
        &quot;maxSizeBytes&quot;: &quot;[parameters('DB Max Size')]&quot;,
        &quot;requestedServiceObjectiveName&quot;: &quot;ElasticPool&quot;,
        &quot;elasticPoolName&quot;: &quot;[variables('Pool A')]&quot;
      }
    },
    {
      &quot;type&quot;: &quot;Microsoft.Sql/servers/databases&quot;,
      &quot;copy&quot;: {
        &quot;name&quot;: &quot;DBs-B&quot;,
        &quot;count&quot;: &quot;[variables('Count B')]&quot;
      },
      &quot;name&quot;: &quot;[concat(parameters('Server Name'), '/', variables('DB B Prefix'), copyIndex())]&quot;,
      &quot;location&quot;: &quot;[resourceGroup().location]&quot;,
      &quot;dependsOn&quot;: [
        &quot;[resourceId('Microsoft.Sql/servers', parameters('Server Name'))]&quot;,
        &quot;[resourceId('Microsoft.Sql/servers/elasticpools', parameters('Server Name'), variables('Pool B'))]&quot;
      ],
      &quot;tags&quot;: {
        &quot;displayName&quot;: &quot;Pool-B DBs&quot;
      },
      &quot;apiVersion&quot;: &quot;2014-04-01-preview&quot;,
      &quot;properties&quot;: {
        &quot;edition&quot;: &quot;[parameters('Pool B Edition')]&quot;,
        &quot;collation&quot;: &quot;SQL_Latin1_General_CP1_CI_AS&quot;,
        &quot;maxSizeBytes&quot;: &quot;[parameters('DB Max Size')]&quot;,
        &quot;requestedServiceObjectiveName&quot;: &quot;ElasticPool&quot;,
        &quot;elasticPoolName&quot;: &quot;[variables('Pool B')]&quot;
      }
    }
  ]
}
[/code]

We can deploy the template as is.  We’ll need to enter at least an Admin password (for the Azure SQL server).

The “Server Name” parameter must be unique throughout Azure (not just your subscription).  So if it happens to be taken when you try to deploy the template (in which case you would receive an error message around <span style="color:#ff0000;">Server 'pooldemoserver' is busy with another operation</span>), try a new, more original name.

Each parameter is documented in the metadata description.
<h2>Results</h2>
Let’s look at the result.  Let’s first go in the resource group where we deployed the template.

In the resource list we should see the following:

<a href="http://vincentlauzon.files.wordpress.com/2016/12/image13.png"><img style="background-image:none;float:none;padding-top:0;padding-left:0;margin-left:auto;display:block;padding-right:0;margin-right:auto;border-width:0;" title="image" src="http://vincentlauzon.files.wordpress.com/2016/12/image_thumb13.png" alt="image" width="640" height="379" border="0" /></a>

We first have our server, with default name <em>pooldemoserver</em>, our two pools, <em>Pool-A</em> &amp; <em>Pool-B</em>, and 6 databases.

Let’s select <em>Pool-A</em>.

<a href="http://vincentlauzon.files.wordpress.com/2016/12/image14.png"><img style="background-image:none;float:none;padding-top:0;padding-left:0;margin-left:auto;display:block;padding-right:0;margin-right:auto;border-width:0;" title="image" src="http://vincentlauzon.files.wordpress.com/2016/12/image_thumb14.png" alt="image" width="640" height="339" border="0" /></a>

We can see the pool is of <em>Standard</em> edition, has 200 eDTUs with a minimum of 10 eDTUs and maximum 50 per databases, which is faithful to its ARM definition (line 10-13).

[code language="javascript"]
        {
          &quot;type&quot;: &quot;elasticpools&quot;,
          &quot;name&quot;: &quot;[variables('Pool A')]&quot;,
          &quot;apiVersion&quot;: &quot;2014-04-01-preview&quot;,
          &quot;location&quot;: &quot;[resourceGroup().location]&quot;,
          &quot;dependsOn&quot;: [
            &quot;[resourceId('Microsoft.Sql/servers', parameters('Server Name'))]&quot;
          ],
          &quot;properties&quot;: {
            &quot;edition&quot;: &quot;[parameters('Pool A Edition')]&quot;,
            &quot;dtu&quot;: &quot;200&quot;,
            &quot;databaseDtuMin&quot;: &quot;10&quot;,
            &quot;databaseDtuMax&quot;: &quot;50&quot;
          }
        }
[/code]

Similarly, <em>Pool-B</em> has a minimum of 0 and a maximum of 100.  The maximum was set to <em>null</em> in the template and hence is the maximum allowed for a <a href="https://docs.microsoft.com/en-us/azure/sql-database/sql-database-resource-limits#service-tiers-and-performance-levels" target="_blank">standard pool of 400 DTUs</a>.

Let’s select the databases in <em>Pool-B</em>.  Alternatively, we can select the <em>Configure pool</em> tool bar option.

<a href="http://vincentlauzon.files.wordpress.com/2016/12/image15.png"><img style="background-image:none;float:none;padding-top:0;padding-left:0;margin-left:auto;display:block;padding-right:0;margin-right:auto;border:0;" title="image" src="http://vincentlauzon.files.wordpress.com/2016/12/image_thumb15.png" alt="image" width="640" height="315" border="0" /></a>

The following pane shows us the eDTUs consumed in the last 14 days.  It also allows us to change the assigned eDTUs to the pool.

It is in this pane that we can add / remove databases from the pool.

<a href="http://vincentlauzon.files.wordpress.com/2016/12/image16.png"><img style="background-image:none;float:none;padding-top:0;padding-left:0;margin-left:auto;display:block;padding-right:0;margin-right:auto;border:0;" title="image" src="http://vincentlauzon.files.wordpress.com/2016/12/image_thumb16.png" alt="image" width="640" height="90" border="0" /></a>

In order to remove databases from the pool, they must first be selected in the lower right pane corner.  We will have to chose a standalone pricing tier for each DB and hit save.  As of today (December 2016), there are no way to <em>move</em> databases from one pool to another directly, i.e. they must first be converted as a stand alone.  It is possible to move databases from a pool to another using PowerShell as I’ll demonstrate in a future article though.

If we go back to the resource group and select any of the database, we have a link to its parent pool.

<a href="http://vincentlauzon.files.wordpress.com/2016/12/image17.png"><img style="background-image:none;float:none;padding-top:0;padding-left:0;margin-left:auto;display:block;padding-right:0;margin-right:auto;border:0;" title="image" src="http://vincentlauzon.files.wordpress.com/2016/12/image_thumb17.png" alt="image" width="640" height="306" border="0" /></a>
<h2>Summary</h2>
Despite the current lack (as of December 2016) of documentation around it, it is quite possible to create databases within an elastic pool using ARM templates as we’ve demonstrated here.