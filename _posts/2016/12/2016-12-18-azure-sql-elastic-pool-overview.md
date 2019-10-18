---
title:  Azure SQL Elastic Pool Overview
date:  2016-12-19 00:00:56 +00:00
permalink:  "/2016/12/18/azure-sql-elastic-pool-overview/"
categories:
- Solution
tags:
- Data
---
What is <a href="assets/2016/12/azure-sql-elastic-pool-overview/rubber-bands-1158199_6401.jpg"><img style="background-image:none;float:right;padding-top:0;padding-left:0;display:inline;padding-right:0;border-width:0;" title="rubber-bands-1158199_640[1]" src="assets/2016/12/azure-sql-elastic-pool-overview/rubber-bands-1158199_6401_thumb.jpg" alt="rubber-bands-1158199_640[1]" width="444" height="333" align="right" border="0" /></a> Azure SQL Elastic Pool and what it brings to Azure SQL Database, the SQL Azure Platform as a Service (PaaS).
<h2>Traditional model</h2>
Let’s look at how Azure SQL works without elastic pools first.

<a href="assets/2016/12/azure-sql-elastic-pool-overview/image11.png"><img style="background-image:none;float:none;padding-top:0;padding-left:0;margin-left:auto;display:block;padding-right:0;margin-right:auto;border-width:0;" title="image" src="assets/2016/12/azure-sql-elastic-pool-overview/image_thumb11.png" alt="image" width="500" height="106" border="0" /></a>Azure SQL Database comes with an Azure SQL Server.  This shouldn’t be confused with SQL Server installed on a VM:  it is a logical server holding everything that doesn’t belong to a database.  This model makes it compatible with SQL server “on premise”.

The important point here is that <strong>the compute sits with the database and not the server</strong>.  The edition (i.e. Basic, Standard &amp; Premium) &amp; Pricing Tier / DTUs are set at the database level, not the server level.  Actually, the server doesn’t even have a cost associated to it.

In some ways, this is the opposite to what SQL Server on premise got us used to.  On premise, we have a server sitting on an OS and the databases construct on top of it borrowing computes from the Server.  In Azure the compute sits at the database level  while the server is this pseudo centralized thing with no compute associated to it.

In that sense, Azure SQL DB has a much better isolation model out of the box although you can now do the same thing with SQL Server on premise using the <a href="https://msdn.microsoft.com/en-us/library/bb933866.aspx" target="_blank">Resource Governor</a>.
<h2>Elastic Pool Conceptual model</h2>
<a href="assets/2016/12/azure-sql-elastic-pool-overview/image12.png"><img style="background-image:none;float:right;padding-top:0;padding-left:0;display:inline;padding-right:0;border-width:0;" title="image" src="assets/2016/12/azure-sql-elastic-pool-overview/image_thumb12.png" alt="image" width="500" height="175" align="right" border="0" /></a>Along came <a href="https://docs.microsoft.com/en-us/azure/sql-database/sql-database-elastic-pool" target="_blank">Elastic Pool</a>.  Interestingly, Elastic Pools brought back the notion of a centralized compute shared across databases.  Unlike on premise SQL Server on premise though, that compute doesn’t sit with the server itself but with a new resource called an elastic pool.

This allows us to provision certain compute, i.e. DTUs, to a pool and share it across many databases.

A typical scenario where that is beneficial is a lot of small databases which tend to be cost prohibitive with the traditional model.

That makes it an excellent solution for ISV / SaaS providers where different tenants have different spikes.

See <a href="https://docs.microsoft.com/en-us/azure/sql-database/sql-database-elastic-pool-guidance" target="_blank">this article</a> for the different scenarios where elastic pools apply.

We could have “hybrid” scenarios where a server have  “traditional databases” with their own pricing tier and databases attached to a pool.
<h2>DTU policy</h2>
The pool can define a policy regarding the minimum and maximum DTUs per database.  This allows for each database
<ul>
 	<li>to have a minimum amount of compute dedicated to it, avoiding compute starvation</li>
 	<li>to have a maximum amount of compute, avoiding the noisy neighbour effect avoiding that one database starves all the others</li>
</ul>
<h2>Storage</h2>
On the other hand, a pool has a maximum storage size shared across the pool.

No policies limit an individual database to take more storage although a database maximum size can be set on a per-database basis.

It is important to note that once the maximum pool size has been reached by the sum of the databases’ size, all databases become read only.
<h2>Limits</h2>
I often find it useful to look at the different limits and quotas of Azure services to understand the structure of a service and inform design decisions.

<a href="http://aka.ms/azurelimits">http://aka.ms/azurelimits</a> should never be too far in your links.

Looking at <a href="https://docs.microsoft.com/en-us/azure/sql-database/sql-database-resource-limits" target="_blank">Azure SQL databases limits</a>, we find those interesting facts:
<ul>
 	<li>Maximum number of databases per pool vary depending on the pool size, e.g. a Standard 100 DTUs can have 200 databases</li>
 	<li>A server can have up to 5000 databases associated to it</li>
 	<li>A server can have up to 45000 DTUs associated to it, either via elastic pools, databases directly or even <a href="https://vincentlauzon.com/2016/07/31/how-does-azure-data-warehouse-scale/">Azure Data Warehouses</a></li>
 	<li>There is no documented limit on the number of pools per server</li>
 	<li>The server, its pools &amp; databases must be in the same Azure region under the same subscription</li>
</ul>
Let’s look at a few design questions now.
<h3>Why use more than one pool?</h3>
Why not using a pool with a huge number of DTUs?
<ul>
 	<li>Ultimately a pool cannot be of infinite size (4000 DTUs / 750 GB for Premium, 3000 DTUs / 2.9 TB for Standard) so we’ll use multiple pools to scale</li>
 	<li>Policies, i.e. min / max DTU are setup at the pool level ; if we have a bunch of tiny DBs with little transactions on &amp; a group of middle sized DBs with more traffic on them, we might want to have multiple pools with different policies to handle those</li>
</ul>
<h3>Should we have one server per pool or multiple pools per server?</h3>
An Azure SQL Server does very little:
<ul>
 	<li>Holds an Admin account for the entire server</li>
 	<li>Holds the pools &amp; databases</li>
 	<li>Exists in a region</li>
</ul>
Obviously, multiple regions, multiple servers.

Why would we choose multiple servers over one server multiple pools?  Security:  if we want to segregate access to different databases at the administration level, we wouldn’t want to share one admin account for all.

A lot can be argued around that point, e.g. we could have one admin account for every DBs but different admins per DB for instance.  In compliance scenario, I could see this playing out, e.g. dev vs prod, banking vs federal customers, etc.  .
<h3>Why use a Premium elastic pool?</h3>
Standard pools have bigger storage and comparable parallelism specs, so why go Premium and pay a…  Premium?

The main spec where Premium shines is for min / max DTUs per DB:  Premium allows us to have bigger databases within a pool while Standard is geared to have smaller DBs.

More concretely, standard pools allow to have up to 100 DTUs per database while in Premium, it goes up to 4000.

As a comparison, 100 DTUs is equivalent to a standalone S3 database.
<h2>Summary</h2>
We did look at Azure SQL Database <em>Elastic Pool</em> feature.

Elastic Pool really is an <em>economic</em> feature as it’s a way to increase the number of databases ran on the same compute and hence reducing the cost.

In scenarios where we have lots of small databases, it can drastically reduce costs.

In a future post, I’ll cover how to provision an Elastic pool using ARM template.