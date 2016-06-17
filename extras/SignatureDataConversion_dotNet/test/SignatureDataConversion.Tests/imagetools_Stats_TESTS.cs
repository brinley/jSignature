using System;
using System.Collections.Generic;
using System.IO;
using System.Diagnostics;
using System.Text.RegularExpressions;

using NUnit.Framework;

/*
 * Note about these tests.
 * 
 * The tests are based on NUnit framework. NUnit framework has a separate "runner" that is
 * external to Visual Studio. (Meaning, you don't "F5" it.)
 * 
 * In the folder containing this project you should find a ***.nunit file. When NUnit framework
 * is installed, double-clicking on the file will open it in the NUnit runner. Select individual
 * tests or a branch of tests and "Run"
*/


/* 
 * Test fixture template

    [TestFixture]
    public class TestGroupName : TestBase
    {

        [Test]
        public void NameOfTest()
        {
            Assert.AreEqual(
                true,
                true
                );
        }
    }

*/
namespace jSignature.Tools.Tests
{
    using jSignature.Tools;

    [TestFixture]
    public class ImageTools : TestBase
    {
        [Test]
        public void id001_Sizes()
        {
            var c = new jSignature.Tools.Base30Converter();
            var uncompresseddataobject = c.Base30ToNative(compressedtestdata);
            var stats = new jSignature.Tools.Stats(uncompresseddataobject);

            // above sig has the following limits
            // x 121 to 496
            // y 66 to 233

            Assert.AreEqual(
                new int[] {121, 66, 496, 233}
                , stats.ContentLimits
            );

            Assert.AreEqual(
                new int[] { 496 - 121 + 1, 233 - 66 + 1 }
                , stats.ContentSize
            );

            Assert.AreEqual(
                new int[] { 496, 233 }
                , stats.Size
            );
        }
    }
}
