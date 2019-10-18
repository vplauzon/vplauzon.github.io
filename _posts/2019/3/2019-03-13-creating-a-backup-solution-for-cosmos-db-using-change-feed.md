---
title:  Creating a Backup Solution for Cosmos DB using change feed
date:  03/13/2019 10:30:37
permalink:  "/2019/03/13/creating-a-backup-solution-for-cosmos-db-using-change-feed/"
categories:
- Solution
tags:
- Data
- NoSQL
- Operations
---
<img style="float:left;padding-right:20px;" title="From Pexels" src="https://vincentlauzon.files.wordpress.com/2018/12/analog-audio-backup-170290-e1545319364100.jpg" />

<a href="https://vincentlauzon.com/?s=cosmos+db">Cosmos DB</a> is Azure native NoSQL database.  It has awesome capabilities such as <a href="https://docs.microsoft.com/en-ca/azure/cosmos-db/distribute-data-globally">global-distribution</a>, exceptionally <a href="https://docs.microsoft.com/en-ca/azure/cosmos-db/high-availability">high availability</a>, <a href="https://docs.microsoft.com/en-ca/azure/cosmos-db/scaling-throughput">throughput scalability</a>, and <a href="https://docs.microsoft.com/en-ca/azure/cosmos-db/introduction">much, much more</a>.

As with most NoSQL horizontally scalable databases it doesn't have the same backup capabilities as mainstream <a href="https://en.wikipedia.org/wiki/Relational_database_management_system">RDBMS systems</a>.

Cosmos DB has an <a href="https://docs.microsoft.com/en-ca/azure/cosmos-db/online-backup-and-restore">automated backup capability</a>.  It is always there and doesn't affect performance.  It has a few weaknesses though:

<ul>
<li>In order to restore, we need to contact support ; there are no API to restore a backup</li>
<li>We need to contact support within 8 hours as retention is very low</li>
<li>We can't go back in time at an arbitrarily point in time</li>
</ul>

In order to have more control over backups and restores, <a href="https://docs.microsoft.com/en-ca/azure/cosmos-db/online-backup-and-restore#options-to-manage-your-own-backups">online documentation recommends</a> to use <a href="https://docs.microsoft.com/en-ca/azure/data-factory/connector-azure-cosmos-db">Azure Data Factory</a> and / or <a href="https://docs.microsoft.com/en-ca/azure/cosmos-db/change-feed">Azure Cosmos DB change feed</a>.

In this article we are going to look at how we could use the change feed for backups and when it would work and when it wouldn't.

<h2>Change feed 101</h2>

<a href="https://docs.microsoft.com/en-us/azure/cosmos-db/change-feed">Online documentation</a> does a good job at explaining change feed so we won't duplicate that here.

<h2>Change feed Pros &amp; Cons for backups</h2>

Let's look at the pros and cons of the change feed with the lens of backup.

<h3>Pros</h3>

<ul>
<li>Time order (per partition)</li>
<li>Captures both creation and updates of documents</li>
<li>Captures full state of documents</li>
</ul>

Time order means we do not need to sort by timestamp.  The fact it captures the full state of the document simplifies the process greatly.  It means we do not need to reconstruct a document from fragments over time.

This is a great start for a backup solution.  Let's now look at the cons.

<h3>Cons</h3>

In our perspective, there are three broad categories of cons:

<ul>
<li>Deleted Documents

<ul>
<li>Doesn't capture deleted documents</li>
<li>Time to live needs to be tracked at both document and collection level</li>
</ul></li>
<li>Consistency

<ul>
<li>No snapshot</li>
<li>Only latest</li>
</ul></li>
<li>Only covers documents

<ul>
<li>Not collection settings (e.g. default time to live)</li>
<li>Not stored procedures</li>
<li>Not functions</li>
<li>Not triggers</li>
</ul></li>
</ul>

Deleted documents probably are the biggest issue.  It is <a href="https://docs.microsoft.com/en-us/azure/cosmos-db/change-feed#change-feed-and-different-operations">recommended in general</a> (not just in the context of backup) to either:

<ul>
<li>Soft delete documents ; e.g. have an <em>isDeleted</em> field in documents and filter against it on queries</li>
<li>Use time-to-live at the document level as this is just a document field and will be caught by change feed</li>
</ul>

This is a good recommendation but could mean substantial changes to the logic of a solution.  For this reason, it likely is the biggest show stopper.

There is a lot to be told about not deleting records as a design principle.  Greg Young <a href="https://www.youtube.com/watch?v=JHGkaShoyNs">makes a great argument for it</a> using <a href="https://martinfowler.com/bliki/CQRS.html">CQRS</a> and <a href="https://martinfowler.com/eaaDev/EventSourcing.html">Event Sourcing</a>.  Unfortunately, in most solutions records do get deleted.

Time to live can be either at collection or document level.  Or both, in which case, the document level time to live wins.  This makes it non-trivial to predict the deletion of a document in the context of a backup.

Consistency is a subtler problem.  We will analyze it in detail in the next section.

Finally, the fact that only documents are in the change feed isn't a show stopper.  But it does add custom logic we would need to write to have a complete backup solution.

<h2>When would a backup be inconsistent?</h2>

Let's tackle the consistency problem.  As we have stated in the previous section, there are two limitations of the change feed in that regard.  First, there are no snapshot.  So, while we consume the change feed, changes are pushed that modify the change feed.  Second, only the latest change is in the change feed.  So, if we create a document and update it twice, only the second update will be in the change feed.

This can very easily lead to inconsistency.  Let's remember the goal of a backup:  to take a consistent copy of a collection.  Data should be consistent at least within a partition.

Let's look at the following example.  Here we consider only one document.  On that document is performed 6 updates:  A, B, C, D, E &amp; F.  We also do two backups.  During the backup we read the change feed from last backup until "now".

We establish "now" as the time at the beginning of the backup.  This way, even if there is a lot of activity during the backup, we will eventually catch up with the beginning of the backup and stop.

<img src="https://vincentlauzon.files.wordpress.com/2018/12/Backup-Fails.png" alt="Backup Fails" />

We see that during the first backup, the <em>Update C</em> occurs.  Now this leads to a racing condition for what is captured in the backup:

<ul>
<li>If Update B was captured by the backup (in the change feed) before Update C occur, then <em>B</em> is the captured state</li>
<li>If Update C occur before the backup captures Update B, then <em>Update C</em> will appear in the change feed

<ul>
<li>The timestamp will be after the backup start so we won't capture it</li>
</ul></li>
</ul>

This is worse as we compound backups.  Let's assume that <em>Update B</em> was captured by the first backup and let's look at the second backup.

Now let's assume that <em>Update F</em> occurs before we can read <em>Update E</em> in the change feed.  <em>Update F</em> having a timestamp higher than the start of <em>Backup 2</em>, it isn't captured.  That means that from the backup perspective, the document still is in the state of <em>Update B</em>.  That means the state prior to <em>Backup 1</em>!

This is because the intermediary updates are <em>erased</em> from the change feed as new ones occur.

We can see that this could easily lead to inconsistent state in the backup.  Different documents could be captured with different lag.  Together they would form an inconsistent picture of what the collection looked like at the beginning of the backup.

For those reasons, Change Feed might look like a very bad backup solution foundation.  Before we discard it altogether, let's look at scenarios where change feed lead to a consistent image of a collection.

<h2>When would a backup be consistent?</h2>

<img src="https://vincentlauzon.files.wordpress.com/2018/12/Backup-works-1.png" alt="Backup Works" />

Here <em>Backup 1</em> captures <em>Update A</em> which is the state of the collection at the beginning of <em>Backup 1</em>.  Similarly, <em>Backup 2</em> captures nothing on the same document since <em>Update B</em> occurs after the backup started.  Again, this is consistent with the state of the collection at the beginning of <em>Backup 2</em>.

Why does it work now?

Basically, we want to have the picture above:  updates occurring every other backup.

We want two metrics to be low:

<ul>
<li>Document change rate (i.e. # of changes on one document per hour)</li>
<li>Backup duration (i.e. the time it takes for us to consume the change feed since the last backup)</li>
</ul>

In extreme cases:

<ul>
<li>If documents never changed once created, we wouldn't have conflicts</li>
<li>Instantaneous backups, we would essentially have a snapshot of a collection at the beginning of a backup</li>
</ul>

Those two extreme cases help understand the dynamic but aren't helpful.  Instantaneous backups aren't possible due to inherent latency.  Non-changing documents collection is basically a backup itself.

We are left with trying to shorten the backup duration and / or have backup occurring at a faster pace than document changes.

Those two goals aren't mutually exclusive.  On the contrary, frequent backups would lead to shorter change feed.  This would mean a shorter time for backup.

<strong>In order to have consistent backup we need to take frequent quick backups.</strong>

This would be very hard for a collection experiencing a lot of document changes, e.g. IOT.  We would argue that backup solutions are likely to fail in those scenarios anyway.  The only thing fast enough to absorb a very fast pace <em>firehose</em> type of data stream is Cosmos DB.

<h2>Summary</h2>

Using change feed for implementing a custom backup solution for Azure Cosmos DB is possible.  But it isn't trivial.

First, we need to take care of how we capture deleted documents as change feed doesn't capture them.  This requires the solution to take care of it.

Second, we need to take snapshot of collection settings, stored procedures, functions &amp; triggers separately.

Finally, we need to take backups quickly (i.e. no fancy processing) and frequently.

Although those considerations limit the range of scenarios, it still leaves a lot of scenarios where it makes sense.