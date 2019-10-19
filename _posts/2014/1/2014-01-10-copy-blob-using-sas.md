---
title:  Copy blob using SAS
date:  2014-01-10 19:57:00 -05:00
permalink:  "/2014/01/10/copy-blob-using-sas/"
categories:
- Solution
tags:  []
---
<p>I have been trying for a couple of days to find an easy way (read:&#160; using tools) to copy blobs in Windows Azure Storage, not by using management keys but using Shared Access Signature (SAS).</p>  <p>Sounds simple enough.&#160; I remembered the AzCopy tool.&#160; I looked around and found a <a href="http://blogs.msdn.com/b/windowsazurestorage/archive/2013/09/07/azcopy-transfer-data-with-re-startable-mode-and-sas-token.aspx">blog post explaining how to use it with SAS</a>, using the DestSAS switch.</p>  <p>I spent hours and I could never make it work.&#160; For starter, AzCopy is designed to copy folders instead of individual files.&#160; But also, I could never get the SAS to work.</p>  <p>After those lost hours, I turned around and look at the <a href="http://msdn.microsoft.com/en-us/library/windowsazure/dd135733.aspx">Storage REST API</a>.&#160; Turns out you simply need to do an <a href="http://msdn.microsoft.com/en-us/library/windowsazure/dd179451.aspx">HTTP PUT</a> in order to write a blob into a container.&#160; If the blob doesn’t exist, it creates it, if it exists, it updates it.&#160; Simple?</p>  <p>In PowerShell:</p>  <blockquote>   <p>$wc = new-object System.Net.WebClient</p>    <p>$wc.UploadFile(&lt;Blob Address&gt;, &quot;PUT&quot;, &lt;Local File Path&gt;)</p> </blockquote>  <p>The <em>Blob Address</em> needs to be the URI containing a SAS.</p>  <p>Enjoy!</p>