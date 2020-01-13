---
title: NoSQL implementation concepts
date: 2014-10-07 19:38:13 -07:00
permalink: /2014/10/07/nosql-implementation-concepts/
categories:
- Solution
tags:
- NoSQL
---
<p>While familiarizing ourselves with Microsoft <a href="http://vincentlauzon.wordpress.com/2014/09/18/digest-documentdb-resource-model-and-concepts/">new DocumentDB</a>, a solid foundation on NoSQL doesn't hurt.
</p><p><img align="left" src="/assets/posts/2014/4/nosql-implementation-concepts/100814_0257_nosqlimplem1.png" alt="" />A few years ago, I saw a couple of great presentations on <a href="http://channel9.msdn.com/">Channel9</a> (from a TechED if I am not mistaken) about Azure Storage.  The presenters went into how partitioning works, how requests are routed, how consistency is ensure, how resiliency (in case of node failure) is insured, etc.  .  Those were quite specific to Azure Blob &amp; Table storage.
</p><p>Recently, I came across <a href="http://cloud.dzone.com/users/riho">Ricky Ho</a>'s excellent NoSQL primer:  <a href="http://cloud.dzone.com/news/nosql-patterns">NOSQL Patterns</a>.  This article has two main advantages:
</p><ul><li>It is relatively generic (it isn't tied to a specific implementation of NoSQL product)
</li><li>It is relatively short (compare to a one hour Channel9 presentation)
</li></ul><p>This conceptual overview gives you an excellent background to better understand the mechanism behind <a href="http://vincentlauzon.wordpress.com/2014/09/08/azure-documentdb-first-use-cases/">Azure DocumentDB</a> and its design tradeoffs.
</p><p>Ricky goes into:
</p><ul><li>Topology:  how are physical and virtual nodes laid out
</li><li>Partitioning:  how is data partitioned &amp; replicated over many virtual nodes
</li><li>Dynamic Membership:  how is data mapped to different partitions as nodes join and leave the topology
</li><li>Consistency:  how is the database exposing a consistent view to a consumer while data is replicated and moving around on many distributed nodes
</li><li>Replication algorithms
</li></ul><p><img align="right" src="/assets/posts/2014/4/nosql-implementation-concepts/100814_0257_nosqlimplem2.png" alt="" /> It is especially interesting while working with Azure DocumentDB since that product offers a lot of configurable tradeoffs (e.g. in terms of consistency policy, index building, etc.).</p>