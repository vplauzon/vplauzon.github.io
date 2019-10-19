---
title:  Quantum Computing - Scenarios
date:  2018-03-14 06:30:22 -04:00
permalink:  "/2018/03/14/quantum-computing-scenarios/"
categories:
- Solution
tags:
- Machine Learning
- Quantum
---
<a href="http://vincentlauzon.files.wordpress.com/2018/03/tail-2801599_640.jpg"><img style="border:0 currentcolor;float:left;display:inline;background-image:none;" title="tail-2801599_640" src="http://vincentlauzon.files.wordpress.com/2018/03/tail-2801599_640_thumb.jpg" alt="tail-2801599_640" width="320" height="100" align="left" border="0" /></a>We recently looked at <a href="https://vincentlauzon.com/2018/03/07/quantum-computing-value-proposition/">Quantum Computing value proposition</a>.

Quantum Computer can solve some problems by several order of magnitude. This brings today’s intractable problems to be easy to solve tomorrow.

Not all problems have this property. In this article, we’ll look at some problems that do.

This is a technical-light article with no mathematics.
<h2>Cryptography</h2>
<a href="http://vincentlauzon.files.wordpress.com/2018/03/pexels-photo-193349.jpg"><img style="border:0 currentcolor;float:right;display:inline;background-image:none;" title="binary damage code" src="http://vincentlauzon.files.wordpress.com/2018/03/pexels-photo-193349_thumb.jpg" alt="binary damage code" width="320" height="480" align="right" border="0" /></a>

Classical Computers are good at cryptography. They can encrypt and decrypt relatively quickly.  Every time a web site uses <a href="https://en.wikipedia.org/wiki/Transport_Layer_Security">HTTPS</a>, encryption / decryption is done at the sending and receiving ends seamlessly.

By contrast, they are pretty bad at cracking cryptographic code.  That problem is related to the factoring problem, i.e. finding two prime factors of a giant integer.

For instance, if we take the following integer:

185371383731429345831473
549347347234690345762332
467345692347692347364828
762394682347326498234679
546987327529812752193475

Can we easily tell what are the two prime numbers which product would yield that integer (hint:  no)?

The <a href="https://en.wikipedia.org/wiki/General_number_field_sieve">best known algorithm</a> known is exponential in complexity.  A little more formal would be to say that for an integer of <em>n</em> bits, cracking the code will take O(e<sup>n</sup>) steps.

Shor algorithm is a quantum algorithm.  It solves the factoring problem in polynomial complexity.  Polynomial isn’t linear but it’s way better than exponential.

What does this polynomial vs exponential complexity means? Complexity captures how the computation time evolves with problem size. Exponential complexity grows much faster than polynomial.

This is what makes cryptography useful: for big enough keys, it is too hard to break with today's computers.

By contrast, a Quantum Computer would easily break today's Internet cryptography. No HTTPS communication would be private. Blockchains (e.g. Bitcoins) rely on similar cryptography and would easily be hacked.

<a href="https://en.wikipedia.org/wiki/Post-quantum_cryptography">Post Quantum Cryptography</a> is already a flourishing field so not everything is lost.  But it gives a idea of the power of Quantum Computing.
<h2>Material Research</h2>
<a href="http://vincentlauzon.files.wordpress.com/2018/03/strychnine1.png"><img style="border:0 currentcolor;float:left;display:inline;background-image:none;" title="Strychnine[1]" src="http://vincentlauzon.files.wordpress.com/2018/03/strychnine1_thumb.png" alt="Strychnine[1]" width="320" height="248" align="left" border="0" />
</a>

The basic problem of a lot of material research have similar mathematical communalities. It is about finding a big molecule having a couple of interesting properties.  This could be pharmacology, agriculture (e.g. <a href="https://news.microsoft.com/transform/things-to-come-could-the-cloud-and-quantum-computing-help-feed-the-world/">finding fertilizer catalyst</a>), <a href="https://www.azonano.com/article.aspx?ArticleID=3251">nanotechnology</a>, etc.  .

This requires simulating a very large amount of big molecules.

Classical Computers are unable to find solutions with large molecules in tractable timescale. By tractable timescale, we mean less than a few years.

An exciting avenue would be to find a <a href="https://en.wikipedia.org/wiki/Superconductivity">Super Conductor</a> at room temperature.  Currently known super conductor materials have super conductivity property at very low temperature.

Finding new catalysts would largely improve the <a href="https://en.wikipedia.org/wiki/Carbon_capture_and_storage">Carbon Capture / Sequestration</a> problem.

Quantum Computing could enable the creation of interesting new material.  Today those materials are simply out of reach for computational reasons.
<h2>Machine Learning</h2>
Training complex Machine Learning models is an optimization problem (see our <a href="https://vincentlauzon.com/2015/07/12/machine-learning-an-introduction-part-2/">introduction articles</a>).  It consists in finding an optimal parameter within a huge parameter space.

For those relying on <a href="https://www.youtube.com/watch?v=KtIPAPyaPOg">linear algebra</a>, e.g. <a href="https://www.microsoft.com/en-us/research/video/transforming-machine-learning-optimization-quantum-computing/">Boltzmann Machines</a>, there are very promising avenues.

<a href="https://en.wikipedia.org/wiki/Seth_Lloyd">Seth Lloyd</a> gave an <a href="https://www.youtube.com/watch?v=Lbndu5EIWvI">insightful lecture</a> about different <span style="display:inline !important;float:none;background-color:transparent;color:#333333;cursor:text;font-family:Georgia, 'Times New Roman', 'Bitstream Charter', Times, serif;font-size:16px;font-style:normal;font-variant:normal;font-weight:400;letter-spacing:normal;orphans:2;text-align:left;text-decoration:none;text-indent:0;text-transform:none;white-space:normal;word-spacing:0;">Machine Learning algorithms and how they could beneficiate from </span>Quantum Computing.
<h2>Summary</h2>
We’ve looked at often cited problems that would benefit from Quantum Computing.

Disruptive technologies do not only solve problems that couldn’t be solve yesterday.  It typically opens up new scenarios that were not considered before.

Public Cloud Computing brought the notion of pay per use.  This was quickly pushed to “pay per minute” (and even seconds in some cases).  This eventually made possible <a href="https://vincentlauzon.com/2017/11/27/serverless-compute-with-azure-functions-getting-started/">serverless computing</a>.  Serverless computing isn’t something would have been conceived on premise.

In a similar vein, scenarios aren’t on the table today because their prerequisites do not exist yet. Once Quantum Computing enables those prerequisites, the real disruption will begin.