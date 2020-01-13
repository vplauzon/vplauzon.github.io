---
title: SQL Server In-Memory value and use cases
date: 2015-09-13 16:00:54 -07:00
permalink: /2015/09/13/sql-server-in-memory-value-and-use-cases/
categories:
- Solution
tags:
- Data
---
<a href="/assets/posts/2015/3/sql-server-in-memory-value-and-use-cases/eprom021.png"><img class="size-medium wp-image-1201 alignright" src="/assets/posts/2015/3/sql-server-in-memory-value-and-use-cases/eprom021.png?w=300" alt="EPROM02[1]" width="300" height="234" /></a>

Microsoft SQL Server 2014 has made it in the leader category of Forrester's recent <a href="https://www.forrester.com/The+Forrester+Wave+InMemory+Database+Platforms+Q3+2015/fulltext/-/E-res120222" target="_blank">In-Memory Database Platforms, Q3 2015</a> report.

SQL Server 2014 was behind SAP's Hana, Oracle TimesTen &amp; IBM DB2 with BLU acceleration.  It was on pare with Teradata Intelligent Memory.  Those were the leaders.  Following were the strong performers with MemSQL &amp; Kognito among others.

SQL Server 2016, as I mentioned in my <a href="http://vincentlauzon.com/2015/07/22/sql-server-2016/">rundown of its new features</a>, has improved on SQL Server 2014 regarding in-memory capacity.  But it isn't released yet and Forrester's methodology required the product to be released for at least 9 months with a sizeable customer base.
<h3>What does in-memory doing in a Database Engine?</h3>
Many people are confused by the in-memory features of SQL Server or why, in general, would a Database Engine in general has such feature.  At first glance, it does appear a bit odd:
<ul>
	<li>Doesn't RDMS engines already have caching mechanisms to keep hot data in-memory?</li>
	<li>Shouldn't the written data be stored on disk at transaction commit time to guarantee durability?</li>
	<li>By putting tables in-memory 'all the time', don't you unbalance how the rest of the tables can get cached?</li>
	<li>Scenarios such as "rapid write" don't make much sense since you can't write for ever in-memory, can't you?</li>
</ul>
Those are valid points and I'll take time here to explain how this feature can, <span style="text-decoration:underline;">in the right circumstances</span>, improve performance by an order of magnitude.

So, first, yes, <span style="text-decoration:underline;">in the right circumstances</span>.  I underlined that because it isn't a turbo button you press and everything is faster and you don't pay the price elsewhere.  For some workloads, it performs ok and isn't worth the memory it consumes while for some scenarios, you rip this multifold improvement.  Your mileage will vary.  It's a tool in your toolbox.  I hope that the explanations I give here will help you figure out when it should help you.

You can look at <a href="https://msdn.microsoft.com/en-us/library/dn133186.aspx" target="_blank">SQL Server 2016 Book Online</a> for insights on In-Memory features.  The book relates some key scenarios where it makes sense.

But if you are truly considering in-memory for mission critical workloads, go with <a href="https://msdn.microsoft.com/library/dn673538.aspx" target="_blank">In-Memory OLTP – Common Workload Patterns and Migration Considerations</a> white paper.  It goes deep and explain key concepts very well.
<h3>Better than cached page</h3>
SQL query engine does cache hot data.  Basically, when you query data, it loads <em>data pages</em> in-memory and keep them there until it needs more memory elsewhere.

But traditional table are still optimized for disk access, a slow medium.  As such, it has a variety of bottlenecks.

<a href="/assets/posts/2015/3/sql-server-in-memory-value-and-use-cases/padlock-520x3471.jpg"><img class="size-full wp-image-1206 alignleft" src="/assets/posts/2015/3/sql-server-in-memory-value-and-use-cases/padlock-520x3471.jpg" alt="padlock-520x347[1]" width="520" height="347" /></a>A big issue is the contention on the different locking mechanisms.

Each time a transaction reads data, it acquires a <em>read-lock</em> on that data.  When another transaction wants to write on the same data, it must acquire a <em>write-lock</em> and therefore wait for the first transaction to complete since you can't write while data is being read.

SQL also implements latches and spinlocks at different levels.

All those locking mechanism take time to manage but moreover, they collapse in terms of performance in some scenario.

A typical scenario is a read-write at the "end of a table".  Here I talk about your typical table where the clustered index, despite the better advice of your DBA, is an auto-incremented integer.  Most of the activity tends to occur in the recent data, hence the bottom of the table.  Read and write locks interfere and performance collapses as you increase the number of threads reading and writing.

Another issue is the transaction log.  To guarantee durability, all created/modified data in a transaction must be written to the transaction log at commit-time.  This mean the transaction log is written <strong>often</strong> with <strong>small amount of data</strong>.  This puts a load on the I/O of your system.  Not only the record you modified must be written to the log, but each index is also updated.

Let's compare that with in-memory tables.

In-memory tables are completely loaded in-memory.

They <strong>do not implement lock</strong>.  Instead, they implement optimistic concurrency using a multi-version scheme.  This eliminates lock contention.

They do write to disk to implement durability.  But only records.  They <strong>do not write index to disk</strong>:  indexes exist only in-memory.  This reduce I/O considerably.

In some scenarios, the data might not even be written to disk (more on that later).  In those cases, this eliminates I/O from the equation.

Natively compiled stored procedures can also increase CPU utilization (i.e. the amount of useful work the CPU does as oppose to parsing queries) dramatically.

&nbsp;

With this in mind, we can see that in-memory tables aren't just 'cached normal tables'.  They are qualitatively different beasts.  They are optimized for memory and the same algorithms wouldn't work for disk-based tables (e.g. you would need to persist the indexes).
<h3>Non-durable tables</h3>
<a href="/assets/posts/2015/3/sql-server-in-memory-value-and-use-cases/phoeonix-clip-art-67701.jpg"><img class=" wp-image-1208 alignright" src="/assets/posts/2015/3/sql-server-in-memory-value-and-use-cases/phoeonix-clip-art-67701.jpg" alt="phoeonix-clip-art-6770[1]" width="240" height="239" /></a>I mentioned non-durable tables.  Yes, with the far extreme, you can tell SQL not to bother persisting your table to disk with <a href="https://msdn.microsoft.com/en-us/library/dn553122.aspx" target="_blank">DURABILITY = SCHEMA_ONLY</a>.

Of course, I wouldn't recommend that with your transactional data.  Some other in-memory database engines are ok with that because they implement replication of data across different nodes (for a very different example, see <a href="http://redis.io/" target="_blank">Redis</a>).  But some scenarios can live with non durable data if they can recreate it in case of failure.

A typical example is a staging table during an ETL.  You could aggressively ingest data from different sources into an in-memory table then efficiently compute some transformation before dumping the results into a normal table.
<h3>How to be scalable with limited memory?</h3>
Most scenarios mentioned in the documentation are about how you can increase the scalability of your system with in-memory tables.  But how can you ingest data forever in a very bound RAM?

Well, you don't, of course.

Either you leverage scenarios that read &amp; write a lot of the same data or you move cold data out.

But this brings us back to the capacity of normal tables to ingest the cold data, doesn't it?

Yes, but it allows you to sustain a burst for <em>a while</em>.  For scenarios where sources bombard you forever, in-memory tables won't help you.  But often, those are only peaks.

Take IOT scenarios where sensors sends data in batch or given a physical event (e.g. a door opens).

Think of in-memory tables as a tool helping you getting out of a threshold where you can't keep up with a peak:  a burst of subscription, a batch of events, etc.  .

&nbsp;
<h3>Summary</h3>
I hope this post gave you a feel of what in-memory tables are for and why they out-perform normal tables in many scenarios.

As I mentioned before, they aren't the mythical silver bullet but a tool in your toolbox.

In that post I focused on OLTP but in-memory tables are extremely popular in analytics as well.  This is where SQL Server 2016 shines with its <a href="http://vincentlauzon.com/2015/07/22/sql-server-2016/">In-memory Columnstore indexes</a>.