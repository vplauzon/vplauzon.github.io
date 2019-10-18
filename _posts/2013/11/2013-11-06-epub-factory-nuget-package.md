---
title:  ePub Factory NuGet package
date:  11/07/2013 02:51:11
permalink:  "/2013/11/06/epub-factory-nuget-package/"
categories:
- Solution
tags:
- .NET
---
I've been publishing this <a href="https://www.nuget.org/packages/EPubFactory/">NuGet package</a>.

Ok, so why do yet another ePub library on NuGet when <a href="https://www.nuget.org/packages?q=epub">there are already a few</a>?

Well, there aren't that many actually and none are <a href="http://msdn.microsoft.com/en-us/library/vstudio/gg597391(v=vs.100).aspx">Portable Class Library</a> (PCL).

So I've built an ePub library portable to both Windows 8+ &amp; .NET 4.5.1. Why not Windows Phone? My library is based on <a href="http://msdn.microsoft.com/en-us/library/system.io.compression.ziparchive%28v=vs.110%29.aspx">System.IO.Compression.ZipArchive</a> which isn't available on Silverlight in general. That being said, what would be a use case to generate an ePub archive on a smart phone?

I have in my possession a <a href="http://www.kobo.com/kobotouch">Kobo Touch</a> (yes, my <a href="http://en.wikipedia.org/wiki/Kobo_Inc.">Canadian fiber</a> got involved when I chose the Kobo). I love to read on it: it is SO much more relaxing for my eyes than a tablet. It's like reading a book but where I can change the content all the time. You see I use it to read a bunch of technical articles on public transport, so I upload new stuff all the time.

I wanted to automatize parts of it and hence I needed an ePub library. I would like to embed that code in a Windows App at some point (this is mostly pedagogical for me you see) so I needed something PCL.

Anywho, two technical things to declare:

1. ePub is complicated!

If you ever want to handcraft an ePub, use <a href="http://stackoverflow.com/questions/19577112/how-to-debug-epub">an ePub validator</a> such as the excellent <a href="http://www.epubconversion.com/ePub-validator-iBook.jsp">http://www.epubconversion.com/ePub-validator-iBook.jsp</a>. Otherwise the ePub just doesn't work and ePub tools (either eReader or Windows App) are quite silent about the problems.

The biggest annoyance for me was the spec that says you should have your first file starting at byte 38. This is the mime type of ePub and is meant to be a sort of check, i.e. no need to open the archive (an ePub is a zip file underneath) for a client to check, simply go at byte 38 and check you have the ePub mime type to validate you have a valid ePub in your hand.

Well, for that you need to write the mime type file first AND not compress it. Apparently that's too much for System.IO.Compression.ZipArchive. I really needed that library since it works in async mode. So I did a 'prototype' epub file with only the mime type using another zip library (the excellent <a href="https://www.nuget.org/packages/DotNetZip/">DotNetZip</a>) and used that prototype as the starting point of any future ePub!

2.  My first NuGet package

Yep! So I went easy on myself and downloaded a graphic tool, <a href="https://npe.codeplex.com/">NuGet Package Explorer</a>.

I didn't use much NuGet feature besides embedding the XML comment file in the NuGet package.

Quite neat!

It's quite cool to handle packages the NuGet way. You can update them at will completely independently…