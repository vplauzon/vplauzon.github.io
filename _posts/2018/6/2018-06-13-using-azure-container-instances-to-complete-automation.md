---
title:  Using Azure Container Instances to complete automation
date:  2018-06-13 10:30:13 +00:00
permalink:  "/2018/06/13/using-azure-container-instances-to-complete-automation/"
categories:
- Solution
tags:
- Automation
- Containers
---
<a href="assets/2018/6/using-azure-container-instances-to-complete-automation/blur-close-up-engineering-633850.jpg"><img style="border:0 currentcolor;float:left;display:inline;background-image:none;" title="blur-close-up-engineering-633850" src="assets/2018/6/using-azure-container-instances-to-complete-automation/blur-close-up-engineering-633850_thumb.jpg" alt="blur-close-up-engineering-633850" width="320" height="214" align="left" border="0" /></a>We looked at <a href="https://vincentlauzon.com/2018/04/26/azure-container-instance-getting-started/">Azure Container Instances</a>.

It allows us to launch a container without a cluster and without a VM.

It is ideal for bursting scenarios.

In this article we’ll look at another scenario for container instances:  automation.
<h2>The limits of ARM Templates</h2>
A great tool for automation in Azure is <a href="https://docs.microsoft.com/en-us/azure/azure-resource-manager/resource-group-authoring-templates">ARM Template</a>.

ARM Templates allow us to <em>describe</em> an Azure deployment.  They describe a target environment.  Azure Resource Manager (ARM) computes a delta between the current and the target and issue changes.

For example, let’s start with nothing deployed and a template describing an Azure App Service.  ARM will create the App Service.  If we then submit a template with an App Service and an Azure SQL database, ARM will create the SQL database.

ARM templates allow us to avoid configuration drift since we only define the target, never the steps to get there.

ARM Templates have limits though.  Not all ARM Template providers are created equal.  Azure Storage just recently supported creating storage containers in ARM template.  Before that, only the storage account could be created.  Cosmos DB supports only the creation of accounts.  We can’t create a Cosmos DB collection, left alone stored procedure or triggers, using a template.

For those other tasks, we must rely on scripting:  either PowerShell scripting or Azure Command Line Interface (CLI) scripting.

There is no common way to bootstrap a script within an ARM template.
<h2>Adding Azure Container Instance at the end</h2>
<a href="https://vincentlauzon.com/2018/05/31/implementing-automating-azure-stream-analytics-pipeline/">Recently, we provided an ARM template</a> deploying a full environment to test Azure Stream Analytics in action.

Part of the deployment was a SQL Database.  A table in the DB gets updates via a Logic App in the deployment.

The ARM Template deploys the SQL Database.  But it can’t run a SQL script to create a table and a stored procedure.

We did run that script using Azure Container Instance.  We called that container image <a href="https://hub.docker.com/r/vplauzon/sql-script-runner/">SQL Script Runner</a>.  The <a href="https://github.com/vplauzon/streaming/tree/master/SummaryStreaming/sql-docker">code for container is on GitHub</a>.  We simply leverage <a href="https://docs.microsoft.com/en-us/sql/tools/sqlcmd-utility">SQL CMD</a>.

The container is reusable.  We simply need to point it to a database and script.

The beauty of this approach is the flexibility.  We can run any environment.  We aren’t tied to only run PowerShell script.  We can run Azure CLI, SQL script, we could even access Azure Management REST API directly if we had to.

In the ARM template, we simply describe a container instance, put a dependency on the Azure SQL DB and pass parameters.

[code language="JavaScript"]

{
  &quot;type&quot;: &quot;Microsoft.ContainerInstance/containerGroups&quot;,
  &quot;apiVersion&quot;: &quot;2018-04-01&quot;,
  &quot;name&quot;: &quot;container-group&quot;,
  &quot;location&quot;: &quot;East US&quot;,
  &quot;dependsOn&quot;: [
    &quot;[resourceId('Microsoft.Sql/servers/databases', variables('SQL Server Name'), variables('SQL DB Name'))]&quot;
  ],
  &quot;properties&quot;: {
    &quot;restartPolicy&quot;: &quot;Never&quot;,
    &quot;containers&quot;: [
      {
        &quot;name&quot;: &quot;sql-script-runner&quot;,
        &quot;properties&quot;: {
          &quot;image&quot;: &quot;vplauzon/sql-script-runner&quot;,
          &quot;environmentVariables&quot;: [
            {
              &quot;name&quot;: &quot;SCRIPT_URL&quot;,
              &quot;value&quot;: &quot;[variables('SQL Script URL')]&quot;
            },
            {
              &quot;name&quot;: &quot;SQL_SERVER&quot;,
              &quot;value&quot;: &quot;[variables('SQL Server FQDN')]&quot;
            },
            {
              &quot;name&quot;: &quot;SQL_DB&quot;,
              &quot;value&quot;: &quot;[variables('SQL DB Name')]&quot;
            },
            {
              &quot;name&quot;: &quot;SQL_USER_NAME&quot;,
              &quot;value&quot;: &quot;[variables('SQL Admin Name')]&quot;
            },
            {
              &quot;name&quot;: &quot;SQL_PASSWORD&quot;,
              &quot;value&quot;: &quot;[parameters('SQL Admin Password')]&quot;
            }
          ],
          &quot;resources&quot;: {
            &quot;requests&quot;: {
              &quot;cpu&quot;: 1,
              &quot;memoryInGb&quot;: 0.2
            }
          }
        }
      }
    ],
    &quot;osType&quot;: &quot;Linux&quot;
  }
}


[/code]

<h2>Updates</h2>
As we mentioned above, the strength of ARM templates is their descriptive nature.  They only contain the target description, not the steps to get there.

Scripts are different.  A version 1 script does something.  A version 2 builds on what version 1 did and continue.  If we run version 2 without running version 1, we won’t get expected results.

How do we manage that if we start introducing container instances in our deployment?

Well, unless we know in which context the container will run, we need to add testing logic.  Just like scripts.  Does this resource already exist?  If not create it.  Etc.
<h2>Summary</h2>
We introduced an alternative scenario for Azure Container Instance.

Containers are often described as “lightweight VMs”.  We prefer to frame them as “heavyweight process”.  They are isolated process that carry their own environment.

That makes them a perfect “Cloud Executable”.

Here we used them as automation tool, but they could be used to launch any process in the cloud.