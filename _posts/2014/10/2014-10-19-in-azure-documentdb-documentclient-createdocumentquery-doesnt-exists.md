---
title:  In Azure DocumentDB, DocumentClient.CreateDocumentQuery doesn’t exists!
date:  2014-10-19 21:30:24 -04:00
permalink:  "/2014/10/19/in-azure-documentdb-documentclient-createdocumentquery-doesnt-exists/"
categories:
- Solution
tags:
- NoSQL
---
<span style="font-family:Times New Roman;font-size:12pt;">This is a quick help for you out there who are developing against Azure DocumentDB in .NET.
</span>

<span style="font-family:Times New Roman;font-size:12pt;">Maybe you read the <a href="http://azure.microsoft.com/en-us/documentation/articles/documentdb-get-started/">Getting Started guide</a> or you found that line of code somewhere else.
</span>
<blockquote><span style="font-family:Times New Roman;font-size:12pt;">var families = client.CreateDocumentQuery(documentCollection.DocumentsLink,
</span>

<span style="font-family:Times New Roman;font-size:12pt;">"SELECT * " +
</span>

<span style="font-family:Times New Roman;font-size:12pt;">"FROM Families f " +
</span>

<span style="font-family:Times New Roman;font-size:12pt;">"WHERE f.id = \"AndersenFamily\"");
</span></blockquote>
<span style="font-family:Times New Roman;font-size:12pt;">Then you try this at home only not to find the said <em>CreateDocumentQuery</em> on the class <em>Microsoft.Azure.Documents.Client.DocumentClient</em>.
</span>

<span style="font-family:Times New Roman;font-size:12pt;">No it isn't there. It isn't because this is a preview service and the doc is out-of-date. It is a good old Linq / extension methods trick.
</span>

<span style="font-family:Times New Roman;font-size:12pt;text-decoration:underline;"><strong>You need to add the line
</strong></span>
<blockquote><span style="font-family:Times New Roman;font-size:12pt;">using Microsoft.Azure.Documents.Linq; </span></blockquote>
<span style="font-family:Times New Roman;font-size:12pt;">at the beginning of your code. This way the code snippet above will actually pick up the extension methods class <em>Microsoft.Azure.Documents.Linq.DocumentQueryable</em>.
</span>