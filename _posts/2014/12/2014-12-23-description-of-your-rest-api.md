---
title:  Description of your REST API:  Swagger & RAML
date:  2014-12-23 08:10:28 -05:00
permalink:  "/2014/12/23/description-of-your-rest-api/"
categories:
- Solution
tags:
- API
---
About a year ago I did a <a href="http://vincentlauzon.com/2013/11/20/wadl-in-a-bottle-eating-noodles/">post about WADL</a>. I hope you didn't build a billion dollars business model around that initiative because it hasn't left the ground yet :(

WADL, or Web Application Description Language for the initiated, was aimed to be what WSDL is for SOAP Web Services but for REST.

You see, the thing with REST that is so vastly superior to SOAP is its simplicity. You do not need a longish incantation of the XML Gods to cast a REST API. You simply need to be able to craft simple XML (or JSON) documents following an HTTP REST semantics.

One of the main problem with REST is its lack of self-description. Once you go beyond the proverbial calculator (always a super good example breaking about all distributed computing patterns) and that you distribute your API around, you will start to have Word or PDF or HTML documents describing your API. This is fine in the age of artisanal API but once you want consumer to plug and play your API, you would want them to do an "Add API reference" in Visual Studio or their favorite IDE.

Entered WADL. Actually, exit WADL: <a href="http://en.wikipedia.org/wiki/Web_Application_Description_Language">it was submitted to W3C in 2009</a> (by Sun Microsystems, oh yeah) and the W3C refused to standardize it.

Let me tell you about two contenders then: <a href="http://swagger.io/">Swagger</a> &amp; <a href="http://raml.org/">RAML</a>.

<a title="Swagger" href="http://swagger.io/"><img src="http://vincentlauzon.files.wordpress.com/2014/12/122314_0331_description1.png" alt="" border="0" /></a>

I heard about <a href="http://swagger.io/">Swagger</a> on <a href="http://channel9.msdn.com/Shows/Web+Camps+TV/Introducing-WebJobs-Tooling-for-Visual-Studio-with-Brady-Gaster">Channel9</a>, so I guess you could say that parts of Microsoft are looking into it.

Swagger has a very good head start in tooling with a lot of support in many target languages / platforms. It also produces a <a href="http://petstore.swagger.wordnik.com/">simple yet compelling UI</a>.

<img src="http://vincentlauzon.files.wordpress.com/2014/12/122314_0331_description2.png" alt="" />

You can look at the <a href="https://github.com/swagger-api/swagger-spec/blob/master/versions/2.0.md">full specifications here</a>, but basically it's a JSON document describing your API. As a side-effect, Swagger enables the description of JSON document and therefore act as a sort of JSON Schema.

<a title="RAML" href="http://raml.org/"><img src="http://vincentlauzon.files.wordpress.com/2014/12/122314_0331_description3.png" alt="" border="0" /></a>

RAML is relatively similar to Swagger. Its format is <a href="http://en.wikipedia.org/wiki/YAML">YAML</a> which is arguably more human-readable than JSON.

RAML seems to be less popular than Swagger but has several advantages, mainly:
<ul>
	<li>Simpler to use to define a non-existing API (API design)</li>
	<li>Existing features to manage repetition in an API (quite frequent)</li>
</ul>
At this point it really isn't clear if either one will end up triumphing or if both will crash and burn. It is interesting to see the interest into an API description language is increasing though so I am confident that within years we will have a standard.

UPDATE:  It would appear that <a href="https://apiblueprint.org/">API Blueprint</a> also is a contender.