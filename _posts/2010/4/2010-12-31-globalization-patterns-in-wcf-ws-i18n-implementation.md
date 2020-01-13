---
title: Globalization Patterns in WCF (WS-I18N implementation)
date: 2010-12-31 07:40:02 -08:00
permalink: /2010/12/31/globalization-patterns-in-wcf-ws-i18n-implementation/
categories:
- Solution
tags:
- API
---
<p>I recently came across a good <a href="http://www.codeproject.com/">Code Project</a> article:</p>  <p><a href="http://www.codeproject.com/KB/WCF/WSI18N.aspx">Globalization Patterns in WCF (WS-I18N implementation)</a></p>  <p>written by <a href="http://weblogs.asp.net/cibrax/">Pablo M. Cibraro</a>.</p>  <p>Basically, there exists a standard specs (<a href="http://www.w3.org/TR/2005/WD-ws-i18n-20050914/">WS-I18N</a>) describing how to pass international information (e.g. locale &amp; time zone) to a SOAP endpoint in order for that web service to return you localized data.</p>  <p>An interesting aspect of that spec is that it passes the international information out-of-band in the soap header.&#160; It therefore doesn’t contaminate your web service signature and if you skip that header, you gracefully get data in the default locale &amp; time zone.</p>  <p>Now Pablo shows how to implement this pattern (or specs) in WCF.</p>  <p>He first shows the server-side, the hard way, using a message-contract where he defines the entire message format of a web-method, including the international header.</p>  <p>He then goes on and shows how you would set the header on the client-side, using message inspectors.</p>  <p>He finally shows a nicer server-side implementation where you do not use message contract (which are frankly annoying to use) but instead use inspectors to gather information from the header.&#160; This hints toward a great system-strategy where you could set the culture of the request thread to the header-culture.</p>  <p>It’s all great stuff!</p>