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
    public class SVGConverterTests : TestBase
    {
        [Test]
        public void id001_ToSVG_Simple()
        {
            var data = new jSignature.Tools.Base30Converter().GetData("3E13Z5Y5_1O24Z66_1O1Z3_3E2Z4");

            string shouldbe = System.IO.File.ReadAllText(Common.SOURCE_PATH + "\\samples\\reference_svg_nonsmoothed.svg");
            string actual = jSignature.Tools.SVGConverter.ToSVG(data);

            // System.IO.File.WriteAllText(Common.SOURCE_PATH + "\\samples\\reference_svg_nonsmoothed.svg", actual);

            Assert.AreEqual(
                shouldbe
                , actual
            );
        }

        [Test]
        public void id002_ToSVG_Smoothing()
        {
            var data = new jSignature.Tools.Base30Converter().GetData("3E13Z5Y5_1O24Z66_1O1Z3_3E2Z4");

            string shouldbe = System.IO.File.ReadAllText(Common.SOURCE_PATH + "\\samples\\reference_svg_smoothed.svg");
            bool smoothing = true;
            string actual = jSignature.Tools.SVGConverter.ToSVG(data, smoothing);

            Assert.AreEqual(
                shouldbe
                , actual
            );
        }

    }
}
