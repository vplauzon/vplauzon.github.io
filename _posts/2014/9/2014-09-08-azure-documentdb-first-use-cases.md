---
title:  Azure DocumentDB:  first use cases
date:  2014-09-09 02:55:14 +00:00
permalink:  "/2014/09/08/azure-documentdb-first-use-cases/"
categories:
- Solution
tags:
- Data
- NoSQL
---
<p>A few weeks ago Microsoft released (in preview mode) its new NoSQL Database:  <a href="http://azure.microsoft.com/en-us/documentation/services/documentdb/">DocumentDB</a>.
</p><p><em>Not Only SQL</em> (NoSQL) databases are typically segmented in the following categories:  Key-Value (e.g. Azure Table Storage, Redis), Column (e.g. HBase, Cassandra), Document (e.g. CouchDB, MongoDB) &amp; Graph.  By its name but mostly by its feature set, DocumentDB falls in the document category.
</p><p><img src="assets/2014/9/azure-documentdb-first-use-cases/090914_0255_azuredocume1.png" alt="" />
	</p><p>My first reaction was <em>Wow, a bit late at the party!</em>
	</p><p>Indeed, the technology space of NoSQL has slowly started to consolidate so it would seem a bit late to get a new product on this crowded market place, unless you have value-added features.
</p><p>And DocumentDB does.  Its main marketing points are:
</p><ul><li>SQL syntax for queries (easy ramp-up)
</li><li>4 consistency policies, giving you flexibility and choice
</li></ul><p>But then you read a little bit more and you realise that DocumentDB is the technology powering OneNote in production with zillions of users.  So it has been in production for quite a while and should be rather stable.  I wouldn't be surprised to learn that it is behind the new Azure Search as well (released in preview mode the same day).
</p><p>Now what to do with that new technology?
</p><p>I don't see it replacing SQL Server as the backbone of major project anytime soon.
</p><p>I do see it replacing its other Azure NoSQL brother-in-law…  Yes, looking at you <a href="http://msdn.microsoft.com/en-us/library/azure/dd179423.aspx">Azure Table-Storage</a> with your dead-end feature set.
</p><p>Table Storage had a nice early start and stalled right after.  Despite the community asking for secondary indexes, they never came, making Table Storage the most scalable <em>write-only </em>storage solution on-the-block.
</p><p>In comparison DocumentDB has secondary indexes and the beauty is that you do not even need to think about them, they are dynamically created to optimize the queries you throw at the engine!
</p><p>On top of indexes, DocumentDB, supporting SQL syntax, supports batch-operation.  Something as simple as saying 'delete all the verbose logs older than 2 weeks' requires a small program in Table Storage and that program will run forever if you have loads of <img align="left" src="assets/2014/9/azure-documentdb-first-use-cases/090914_0255_azuredocume2.jpg" alt="" />records since it will load each record before deleting it.  In comparison, DocumentDB will accept a delete-criteria SQL (one line of code) command and should perform way faster.
</p><p>Actually Logging is the first application I'm going to use DocumentDB for.
</p><p>Having logs in Table Storage is a royal pain when time comes to consume the log.  Azure Storage Explorer?  Oh, that's fantastic if you have 200 records.  Otherwise you either load them in Excel or SQL, in both cases defying the purpose of having a scalable back-end.
</p><p>
 </p><p>Yes, I can see DocumentDB as a nice intermediary between Azure SQL Federation (where scalability isn't sufficiently transparent) and Table Storage (for reasons I just enumerated).  In time I can see it replacing Table Storage, although that will depend on the pricing.
</p><p>I'll try to do a logging POC.  Stay tune for news on that.</p>