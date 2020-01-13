---
title: Azure SQL Elastic Pool – Database Size
date: 2017-01-04 16:00:18 -08:00
permalink: /2017/01/04/azure-sql-elastic-pool-database-size/
categories:
- Solution
tags:
- Automation
- Data
---
<a href="/assets/posts/2017/1/azure-sql-elastic-pool-database-size/pexels-photo-2257691.jpg"><img class="alignnone  wp-image-2940" style="background-image:none;float:left;padding-top:0;padding-left:0;display:inline;padding-right:0;border-width:0;" src="/assets/posts/2017/1/azure-sql-elastic-pool-database-size/pexels-photo-2257691.jpg" alt="Planets" width="322" height="149" /></a>I mentioned in a <a href="https://vincentlauzon.com/2016/12/18/azure-sql-elastic-pool-overview/">past article</a>, regarding database sizes within an elastic pool:

“No policies limit an individual database to take more storage although a database maximum size can be set on a per-database basis.”

I’m going to focus on that in this article.

An Azure SQL Database resource has a <em>MaxSizeInBytes</em> property.  We can set it either in an ARM template (see this <a href="https://vincentlauzon.com/2016/12/21/azure-sql-elastic-pool-arm-templates/">ARM template</a> and the property <em>maxSizeBytes</em>) or in PowerShell.

An interesting aspect of that property is that:
<ul>
 	<li>It takes only specific values</li>
 	<li>Not all values are permitted, depending on the elastic pool edition (i.e. Basic, Standard or Premium)</li>
</ul>
<h2>Valid values</h2>
One way to find the valid values is to navigate to the <a href="https://docs.microsoft.com/en-us/azure/azure-resource-manager/resource-manager-supported-services#databases" target="_blank">ARM schema</a>.  That documented schema likely is slightly out of date since, as of December 2016, the largest value is 500GB, which isn’t the largest possible database size (1 TB for a P15).

The online documentation of <a href="https://docs.microsoft.com/en-us/powershell/resourcemanager/AzureRM.Sql/v1.0.12/Set-AzureRmSqlDatabase" target="_blank">Set-AzureRmSqlDatabase</a> isn’t fairing much better as the documentation for the <em>MaxSizeBytes</em> parameter refers to a parameter <em>MaxSizeGB</em> to know about the acceptable values.  Problem is, <em>MaxSizeGB</em> parameter doesn’t exist.

But let’s start with the documented schema as it probably only lacks the most recent DB sizes.

Using that schema list of possible values and comparing that with the <a href="https://docs.microsoft.com/en-us/azure/sql-database/sql-database-resource-limits#enforcement-of-limits" target="_blank">stand alone database size for given editions</a>, we can conclude (after testing with ARM templates of course), that a Basic pool can have databases up to 2GB, for Standard we have 250GB and of course Premium can take all values.

It is important to notice that the pool can have larger storage.  For instance, even the smallest basic pool, with 50 eDTUs, can have a maximum storage of 5 GB.  But each DB within that pool can only grow up to 2 GB.

That gives us the following landscape:
<table>
<thead>
<tr style="background:lightgreen;">
<th>Maximum Size (in bytes)</th>
<th>Maximum Size (in GB)</th>
<th>Available for (edition)</th>
</tr>
</thead>
<tbody>
<tr>
<td>104857600</td>
<td>0.1</td>
<td>Premium, Standard, Basic</td>
</tr>
<tr>
<td>524288000</td>
<td>0.5</td>
<td>Premium, Standard, Basic</td>
</tr>
<tr>
<td>1073741824</td>
<td>1</td>
<td>Premium, Standard, Basic</td>
</tr>
<tr>
<td>2147483648</td>
<td>2</td>
<td>Premium, Standard, Basic</td>
</tr>
<tr>
<td>5368709120</td>
<td>5</td>
<td>Premium, Standard</td>
</tr>
<tr>
<td>10737418240</td>
<td>10</td>
<td>Premium, Standard</td>
</tr>
<tr>
<td>21474836480</td>
<td>20</td>
<td>Premium, Standard</td>
</tr>
<tr>
<td>32212254720</td>
<td>30</td>
<td>Premium, Standard</td>
</tr>
<tr>
<td>42949672960</td>
<td>40</td>
<td>Premium, Standard</td>
</tr>
<tr>
<td>53687091200</td>
<td>50</td>
<td>Premium, Standard</td>
</tr>
<tr>
<td>107374182400</td>
<td>100</td>
<td>Premium, Standard</td>
</tr>
<tr>
<td>161061273600</td>
<td>150</td>
<td>Premium, Standard</td>
</tr>
<tr>
<td>214748364800</td>
<td>200</td>
<td>Premium, Standard</td>
</tr>
<tr>
<td>268435456000</td>
<td>250</td>
<td>Premium, Standard</td>
</tr>
<tr>
<td>322122547200</td>
<td>300</td>
<td>Premium</td>
</tr>
<tr>
<td>429496729600</td>
<td>400</td>
<td>Premium</td>
</tr>
<tr>
<td>536870912000</td>
<td>500</td>
<td>Premium</td>
</tr>
</tbody>
</table>
<h2>Storage Policies</h2>
We can now use this maximum database as a storage policy, i.e. a way to make sure a single database doesn’t take all the storage available in a pool.

Now, this isn’t as trivially useful as the eDTUs min / max we’ve seen in a pool.  In the eDTU case, that was controlling how much compute was given to a database at all time.  In the case of a database maximum size, once the database reaches that size, it becomes read only.  That will likely break our applications running on top of it unless we planned for it.

A better approach would be to monitor the different databases and react to size changes, by moving the database to other pool for instance.

The maximum size could be a safeguard though.  For instance, let’s imagine we want each database in a pool to stay below 50 GB and we’ll monitor for that and raise alerts in case that threshold is reached (see <a href="https://vincentlauzon.com/2016/11/27/primer-on-azure-monitor/">Azure Monitor for monitoring and alerts</a>).  Now we might still put a maximum size for the databases of 100 GB.  This would act as a safeguard:  if we do not do anything about a database outgrowing its target 50GB, it won’t be able to grow indefinitely, which could top the pool maximum size and make the entire pool read only, affecting ALL the databases in the pool.

In that sense the maximum size still act as a resource governor, preventing noisy neighbour effect.
<h2>PowerShell example</h2>
We can’t change a database maximum size in the portal (as of December 2016).

Using ARM template, it is easy to change the parameter.  Here, let’s simply show how we would change it for an existing database.

Building on the example we gave in a <a href="https://vincentlauzon.com/2016/12/21/azure-sql-elastic-pool-arm-templates/">previous article</a>, we can easily grab the <em>Pool-A-Db0</em> database in resource group <em>DBs</em> and server <em>pooldemoserver</em>:

[code language="PowerShell"]

Get-AzureRmSqlDatabase -ServerName pooldemoserver -ResourceGroupName DBs -DatabaseName Pool-A-Db0

[/code]

<a href="/assets/posts/2017/1/azure-sql-elastic-pool-database-size/image18.png"><img style="background-image:none;float:none;padding-top:0;padding-left:0;margin-left:auto;display:block;padding-right:0;margin-right:auto;border-width:0;" title="image" src="/assets/posts/2017/1/azure-sql-elastic-pool-database-size/image_thumb18.png" alt="image" width="640" height="272" border="0" /></a>

We can see the size is the one that was specified in the ARM template (ARM parameter <em>DB Max Size</em> default value), i.e. 10 GB.  We can bump it to 50 GB, i.e. 53687091200 bytes:

[code language="PowerShell"]

Set-AzureRmSqlDatabase -ServerName pooldemoserver -ResourceGroupName DBs -DatabaseName Pool-A-Db0 -MaxSizeBytes 53687091200

[/code]

We can confirm the change in the portal by looking at the <strong>properties</strong>.

<a href="/assets/posts/2017/1/azure-sql-elastic-pool-database-size/image19.png"><img style="background-image:none;float:none;padding-top:0;padding-left:0;margin-left:auto;display:block;padding-right:0;margin-right:auto;border:0;" title="image" src="/assets/posts/2017/1/azure-sql-elastic-pool-database-size/image_thumb19.png" alt="image" width="449" height="480" border="0" /></a>
<h2>Default Behaviour</h2>
If the <em>MaxSizeByte</em> property is omitted, either in an ARM Template or a <em>new-AzureRmSqlDatabase</em> PowerShell cmdlet, the default behaviour is for the database to have the maximum capacity (e.g. for Standard, 250 GB).

After creation, we can’t set the property value to <em>null</em> to obtain the same effect.  Omitting the parameter simply keep to previously set value.
<h2>Summary</h2>
We’ve looked at the maximum size property of a database.

It can be used to control the growth of a database inside a pool and prevent a database growth to affect others.