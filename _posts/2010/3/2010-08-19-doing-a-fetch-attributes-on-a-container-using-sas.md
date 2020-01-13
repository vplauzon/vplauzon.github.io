---
title: Doing a fetch-attributes on a container using SAS
date: 2010-08-19 11:06:28 -07:00
permalink: /2010/08/19/doing-a-fetch-attributes-on-a-container-using-sas/
categories:
- Solution
tags: []
---
<p>I’ve bumped into a funny Windows Azure Storage API feature lately.</p>  <p>I was trying to read / write the meta data of a blob-container using a Shared Access Signature (SAS) and got a <strong>404 Resource Not Found</strong>.</p>  <p>Well, after flipping my algorithm upside down quite a few times I considered that was by designed.</p>  <p>It is confirmed, it is by design!</p>  <blockquote>   <p><em>You cannot use a Shared Access Signature to create or delete a container, or to read or write container properties or metadata.</em></p> </blockquote>  <p>(See <a title="http://msdn.microsoft.com/en-us/library/ee395415.aspx" href="http://msdn.microsoft.com/en-us/library/ee395415.aspx">http://msdn.microsoft.com/en-us/library/ee395415.aspx</a>)</p>  <p>Thanks to Neil Mackenzie for <a href="http://social.msdn.microsoft.com/Forums/en-US/windowsazure/thread/f65375e3-991d-4072-a86a-8fa58257db6f/">providing the reference</a>!</p>  <p>Of course, this means that if you really need to do this, you have to use your Primary or Secondary Key and no SAS.&#160; Sad…</p>