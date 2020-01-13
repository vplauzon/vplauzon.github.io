---
title: 'Digest:  DocumentDB Resource Model and Concepts'
date: 2014-09-18 04:00:45 -07:00
permalink: /2014/09/18/digest-documentdb-resource-model-and-concepts/
categories:
- Solution
tags:
- NoSQL
---
<p>Azure DocumentDB has release a <a href="http://vincentlauzon.wordpress.com/2014/09/08/azure-documentdb-first-use-cases/">few weeks ago</a> and with it an early, in small quantity, of <a href="http://azure.microsoft.com/en-us/documentation/services/documentdb/">good quality documentation</a>.
</p><p>One of those article is <a href="http://azure.microsoft.com/en-us/documentation/articles/documentdb-resources/">DocumentDB Resource Model and Concepts</a>.  That article goes through the different concepts of the inner model of DocumentDB.
</p><p>That article sheds some light on the product but also reveal the extent of the announced features and their limitations.  It's definitely recommended reading if you want to understand the product.
</p><p>Here I'm gona focus on a few key points I found important.
</p><p>For starter, here is the <a href="http://en.wikipedia.org/wiki/Concept_map">concept map</a> of DocumentDB.
</p><p><img src="/assets/posts/2014/3/digest-documentdb-resource-model-and-concepts/091814_0244_digestdocum1.png" alt="" />
	</p><h2>Self Links
</h2><p>You notice the partial uris under each box in the diagram (e.g. /dbs/{id}, /users/{id}, etc.)?  Those are part of the <em>self link</em>.
</p><p>Each object in DocumentDB is addressable via a self link, a URI.  For instance, from an account base URI you can reach the stored procedure <em>MyProc</em> in the collection <em>MyCollection </em>in the database <em>MyDatabase</em> by the uri <em>&lt;account base URI</em>&gt;<em>/dbs/MyDatabase/colls/MyCollection/sprocs/MyProc</em>.
</p><p>This is of course a reflection of the fact that DocumentDB exposes a REST API.  The SDK reflects the REST API faithfully so you do not need to traverse the object model to get to a sproc, you can get directly to it by its self link.
</p><h2>Capacity Units:  Account
</h2><p><img align="right" src="/assets/posts/2014/3/digest-documentdb-resource-model-and-concepts/091814_0244_digestdocum2.jpg" alt="" />We configure the number of capacity units (that come with CPUs and storage, basically, VMs) at the account level.
</p><p>So why would you configure multiple accounts in an architecture?  To isolate capacity between workloads.  For instance, if you have two workloads requiring a lot of torque that shouldn't interfere with each other, put them in two different DocumentDB accounts.
</p><h2>Scaling Unit:  Collection
</h2><p><img align="left" src="/assets/posts/2014/3/digest-documentdb-resource-model-and-concepts/091814_0244_digestdocum3.jpg" alt="" />DocumentDB collection is a scaling unit.  It is the ultimate transaction border:  a transaction can't span two collections (left alone two databases).  It is also the one with the size limit:  10GB in the preview.
</p><p>We can guess (although it isn't explicitly stated as such) that a collection is contained within one VM only, hence it's capacity to hold a transaction efficiently and its finite size.  Collections are likely replicated across capacity units but one replica of a collection can't span two capacity units.
</p><p>Hence if you want more storage, add collections…  and start managing partitions yourself unfortunately.
</p><p><strong>And there comes my first product request</strong>:  collections with <em>eventual</em> consistency policy shouldn't have size limit and the sharding should be managed by DocumentDB itself (hidden from the consumer).
</p><h2>SSD backed Document Storage
</h2><p><img align="right" src="/assets/posts/2014/3/digest-documentdb-resource-model-and-concepts/091814_0244_digestdocum4.jpg" alt="" />It is mentioned at a few places the storage is backed by <a href="http://en.wikipedia.org/wiki/Solid-state_drive">Solid State Drive</a> (SSD).  There is no mention of tiering so does it mean the entire DB is stored on SSD?
</p><h2>Automatic but configurable indexing
</h2><p><img align="left" src="/assets/posts/2014/3/digest-documentdb-resource-model-and-concepts/091814_0244_digestdocum5.jpg" alt="" />You do not need to hint DocumentDB at how to construct its indexes.  It figures it out by optimizing your query plans.
</p><p>One thing you can do though is set indexing policies.  For instance you could tell DocumentDB it's alright to update its indexes on a collection asynchronously, hence boosting write performances.
</p><p>Features like this make DocumentDB look quite sophisticated for a V1 product.
</p><h2>Javascript as the language
</h2><p>Yes Javascript is a popular language these days.  But in the case of DocumentDB it serves another purpose than following fashion.
</p><p>Its documents are made of JSON, which is basically Javascript objects.  Hence Javascript is the natural language to manipulate those objects, removing any mismatch between the data and the language manipulating it.  Compare this with C# for instance, all JSON objects manipulations would have meant string manipulation.
</p><h2>Attachments
</h2><p><img align="right" src="/assets/posts/2014/3/digest-documentdb-resource-model-and-concepts/091814_0244_digestdocum6.png" alt="" />Unclear in the initial brochure, DocumentDB can store more than just JSON.  It can attach Binary Large Objects (blobs) to the documents.  The document then act as metadata to the attachment.
</p><h2>Users…  more roles than users
</h2><p><img align="left" src="/assets/posts/2014/3/digest-documentdb-resource-model-and-concepts/091814_0244_digestdocum7.png" alt="" />Users in DocumentDB are aggregation of permissions.  As a user you do not authenticate per se against DocumentDB.  Hence the concept is more akin to role.
</p><p>
 </p><h2>Conclusion
</h2><p>DocumentDB is a quite complete and elegant product.  Despite being in preview mode and being a "0.9" version, it feels —by its feature set— like a strong v1 or even v2.
</p><p>I hope this digest gave you a few pointers.</p>