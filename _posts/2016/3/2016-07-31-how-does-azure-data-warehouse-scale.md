---
title: How does Azure Data Warehouse scale?
date: 2016-07-31 16:00:04 -07:00
permalink: /2016/07/31/how-does-azure-data-warehouse-scale/
categories:
- Solution
tags:
- Data
---
I’ve been diving in the fantastical world of <a href="https://azure.microsoft.com/en-us/services/sql-data-warehouse/" target="_blank">Azure Data Warehouse</a> (ADW) in the last couple of days.

I’ve been reading through all the <a href="https://azure.microsoft.com/en-us/documentation/articles/sql-data-warehouse-overview-what-is/" target="_blank">documentation on Azure.com</a>.  If you are serious about mastering that service I advise you do the same:  it is a worthy read.

In this article, I wanted to summarize a few concepts that are somehow interconnected:  MPP, distribution &amp; partition.  Those concepts all define how your data is spread out and processed in parallel.

Let’s get started!
<h2>Massively Parallel Processing (MPP)</h2>
Let’s start with the general architecture of ADW.

<a href="https://azure.microsoft.com/en-us/documentation/articles/sql-data-warehouse-overview-what-is/" target="_blank"><img src="https://acom.azurecomcdn.net/80C57D/cdn/mediahandler/docarticles/dpsmedia-prod/azure.microsoft.com/en-us/documentation/articles/sql-data-warehouse-overview-what-is/20160725050047/dwarchitecture.png" /></a>

Conceptually, you have one <em>Control Node</em> the clients interact with and it, in turns, interacts with a multitude of <em>Compute Nodes</em>.

The data is stored in Premium Blob storage and is therefore decoupled from the compute nodes.  This is why you can scale out, scale in or even pause your ADW quickly without losing data.

The control node takes a query in input, do some analysis on it before delegating the actual compute to the control nodes.  The control nodes perform their sub queries and return results to the control node.  The control takes the results back, assemble it and return it to the client.

You can tune the number of compute nodes indirectly by requesting more Data Warehouse Unit (DWU) on your instance of ADW.  DWUs were modelled about the DTUs from <a href="https://azure.microsoft.com/en-us/services/sql-database/" target="_blank">Azure SQL Databases</a>.

Cool?  Now let’s dive into how the data and compute are actually split out between the nodes.
<h2>As in Babylon, they were 60 databases</h2>
<a href="https://pixabay.com/en/leo-mosaic-art-museum-berlin-510159/"><img style="background-image:none;float:left;padding-top:0;padding-left:0;display:inline;padding-right:0;border:0;" title="leo-510159_640" src="/assets/posts/2016/3/how-does-azure-data-warehouse-scale/leo-510159_640.jpg" alt="leo-510159_640" width="640" height="429" align="left" border="0" /></a>Apparently Babylonians had quite a kick at the number 60 and some of its multiples, such as 360.  This is why we owe them the <a href="https://en.wikipedia.org/wiki/Second#Early_civilizations" target="_blank">subdivision of the hours</a> in 60 minutes and those in 60 seconds.  Also, the 360 degrees of arc to complete a circle <a href="https://en.wikipedia.org/wiki/Degree_(angle)#History" target="_blank">might have come from them too</a> (or is it because of the 365 days in a year?  we might never know).

Nevertheless, ADW splits the data between 60 databases.  All the time, regardless of what you do.  It’s a constant.  It’s like $latex \Pi$.

I do not know the details around that decision but I guess it optimizes some criteria.

Those databases live on the compute nodes.  It is quite easy, now that you know there are 60 of those, to deduce the number of compute nodes from the dedicated <a href="https://azure.microsoft.com/en-us/pricing/details/sql-data-warehouse/" target="_blank">Data Warehouse Unit</a> (DWU)using my fantastic formula:  $latex \#nodes \times \#db per node = 60$.  We can assume that $latex DWU = \#nodes \times 100$, i.e. the lowest number of DWU corresponds to 1 compute node.
<table border="3" width="817">
<thead>
<tr style="background:green;color:white;">
<th>DWU</th>
<th># Compute Nodes</th>
<th># DB per node</th>
</tr>
</thead>
<tbody>
<tr>
<td>100</td>
<td>1</td>
<td>60</td>
</tr>
<tr>
<td>200</td>
<td>2</td>
<td>30</td>
</tr>
<tr>
<td>300</td>
<td>3</td>
<td>20</td>
</tr>
<tr>
<td>400</td>
<td>4</td>
<td>15</td>
</tr>
<tr>
<td>500</td>
<td>5</td>
<td>12</td>
</tr>
<tr>
<td>600</td>
<td>6</td>
<td>10</td>
</tr>
<tr>
<td>1000</td>
<td>10</td>
<td>6</td>
</tr>
<tr>
<td>1200</td>
<td>12</td>
<td>5</td>
</tr>
<tr>
<td>1500</td>
<td>15</td>
<td>4</td>
</tr>
<tr>
<td>2000</td>
<td>20</td>
<td>3</td>
</tr>
<tr>
<td>3000</td>
<td>30</td>
<td>2</td>
</tr>
<tr>
<td>6000</td>
<td>60</td>
<td>1</td>
</tr>
</tbody>
</table>
That’s my theory anyway…  <strong>I do not have insider information in the product</strong>.  It would explain why we have those jumps as you go higher in the DWUs:  to spread evenly the databases among the compute nodes.

Here’s an example of an ADW instance with 1500 DWU (i.e. 15 compute nodes with 4 DBs each)

<a href="/assets/posts/2016/3/how-does-azure-data-warehouse-scale/image2.png"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border:0;" title="image" src="/assets/posts/2016/3/how-does-azure-data-warehouse-scale/image_thumb2.png" alt="image" width="903" height="543" border="0" /></a>
<h2>Distribution</h2>
So the data you load in ADW is stored in 60 databases behind the scene.

Which data gets stored in which database?

As long as you are doing simple <em>select</em> on one table and that your data is distributed evenly, you shouldn’t care, right?  The query will flow to the compute nodes, they will perform the query on each database and the result will be merged together by the control node.

But once you start joining data from multiple tables, ADW will have to swing data around from one database to another in order to join the data.  This is called <em>Data Movement</em>.  It is impossible to avoid in general but you should strive to minimize it to obtain better performance.

Data location is controlled by the <a href="https://azure.microsoft.com/en-us/documentation/articles/sql-data-warehouse-tables-distribute/" target="_blank">distribution attribute</a> of your tables.  By default, tables are distributed in a <em>round robin</em> fashion:  data goes first to database 1 then 2, then 3…

You can somewhat control where your data will go by using the <em>hash distribution </em>method.  With that method, you specify, when creating your table, that you want the hash algorithm to be used and which column to use.  What this guarantees is that data rows with the same hash column value will end up in the same table.  It doesn’t guarantee that any two hash column value will end up in the same database:  the exact hash algorithm isn’t published.

So, let’s look at a simple example of a round-robin distributed table:

```sql


CREATE TABLE [dbo].MyTable
(
  CustomerID      INT            NOT NULL,
  CustomerName    VARCHAR(32)    NOT NULL,
  RegionID        INT            NOT NULL
)
WITH
(
  CLUSTERED COLUMNSTORE INDEX,
  DISTRIBUTION = ROUND_ROBIN
)

```

Since round robin also is the default distribution, I could have simply omit to specify it:

```sql

CREATE TABLE [dbo].MyTable
(
  CustomerID      INT            NOT NULL,
  CustomerName    VARCHAR(32)    NOT NULL,
  RegionID        INT            NOT NULL
)
WITH
(
  CLUSTERED COLUMNSTORE INDEX
)

```

And now with a hash algorithm:

```sql

CREATE TABLE [dbo].MyTable
(
  CustomerID      INT            NOT NULL,
  CustomerName    VARCHAR(32)    NOT NULL,
  RegionID        INT            NOT NULL
)
WITH
(
  CLUSTERED COLUMNSTORE INDEX,
  DISTRIBUTION = HASH(RegionID)
)

```

Here I specified I want the hash to be taken from the <em>RegionID</em> column.  So all customers within the same region will be stored in the same database.

So what have I achieved by making sure that customers from the same regions are stored in the same DB?  If I would want to obtain the sum of the number of customers per region, I can now do it without data movement because I am guaranteed that rows for a given region will all be in the same database.

Furthermore, if I want to join data from another table on region ID, that join can happen “locally” if the other table also has a hash distribution on the region ID.  Same thing if I want to group by region, e.g. summing something by region.

That is the whole point of controlling the distribution:  minimizing data movement.  It is recommended to use it with columns
<ol>
 	<li>That aren’t updated  (hash column can’t be updated)</li>
 	<li>Distribute data evenly, avoiding data skew</li>
 	<li>Minimize data movement</li>
</ol>
It is obviously a somewhat <em>advanced </em>feature:  you need to think about the type of queries you’re gona have and also make sure the data will be spread evenly.  For instance, here, if “region” represents a country and you primarily do business in North America, you just put most of your data in at most two databases (USA + Canada) over 60:  not a good move.

It’s also worth noting that hash distribution slows down data loading.  So if you are only loading a table to perform more transformation on it, just use default round robin.
<h2>Partition</h2>
Then you have <a href="https://azure.microsoft.com/en-us/documentation/articles/sql-data-warehouse-tables-partition/">partitions</a>.  This gets people confused:  isn’t partition a piece of the distribution?  One of the databases?

No.

A partition is an option you have to help manage your data because you can very efficiently delete a partition in a few seconds despite the partition containing millions of rows.  That is because you won’t log a transaction for each row but one for the entire partition.

Also, for extremely large tables, having partitions could speed up queries using the partition key in their <em>where clause</em>.  This is because it would give ADW a hint to ignore all other partitions.  Partitions are stored separately, as if they were separate tables.

As a metaphor, you could consider a partitioned table as a UNION of normal tables ; so using the partition key in the <em>where clause </em>is equivalent to hitting one of the normal tables instead of the UNION, i.e. all tables.  In some scenario, that could provide some good speed up.

You need to have something big to make it worthwhile in terms of query speedup though.  ADW stores its data rows in row groups of up to a million rows.  So if your partitions are small, you just increase the number of row groups which will slow down your queries…  Again, imagine having <em>lots </em>of tables in a UNION.  A query against that would be quite slow.

Here is how I would partition my earlier table:

```sql

CREATE TABLE [dbo].MyTable
(
  CustomerID      INT            NOT NULL,
  CustomerName    VARCHAR(32)    NOT NULL,
  RegionID        INT            NOT NULL
)
WITH
(
  CLUSTERED COLUMNSTORE INDEX,
  DISTRIBUTION = HASH(RegionID),
  PARTITION (
    CustomerName RANGE RIGHT FOR VALUES
    ('E', 'L', 'Q', 'U')
  )
)

```

I built on the previous example which had hash distribution.  But it could have been a round robin distribution.  Those two options (i.e. hash distribution &amp; partitioning) are orthogonal.

It is important to understand that the 60 databases will have the same partitions.  You already have 60 partitions naturally with the 60 databases.  This is why you have to think about it wisely not to slow down your queries.

To visualize that, imagine my example with 5 partitions (4 boundaries means 5 partitions in total):

<a href="/assets/posts/2016/3/how-does-azure-data-warehouse-scale/image3.png"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border:0;" title="image" src="/assets/posts/2016/3/how-does-azure-data-warehouse-scale/image_thumb3.png" alt="image" width="903" height="540" border="0" /></a>

We end up with $latex 60 \times 5 = 300$ partitions.  Is that a good thing?  It depends on the problem, i.e. the way I plan to manage my partitions and the queries being done against it.
<h2>Summary</h2>
Here I tried to explain the different ways your data gets distributed around Azure Data Warehouse (ADW).

I didn’t get into the index &amp; row groups, which is another level of granularity under partitions.

Hopefully that gives you a clear picture of how which compute node access which part of your data, the data itself being in Premium blob storage and not collocated with compute, how you can control its distribution and how you could partition it further.