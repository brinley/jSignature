Imports System
Imports System.Collections.Generic
Imports System.Text
Imports System.Diagnostics
Imports System.Globalization

Namespace jSignature.Tools
    Class Vector
        Public x As Single
        Public y As Single

        Public Sub New(ByVal x As Integer, ByVal y As Integer)
            Me.x = x
            Me.y = y
        End Sub

        Public Sub New(ByVal x As Single, ByVal y As Single)
            Me.x = x
            Me.y = y
        End Sub

        Public ReadOnly Property Reversed As Vector
            Get
                Return New Vector(Me.x * -1, Me.y * -1)
            End Get
        End Property

        Private _length As Single?

        Public ReadOnly Property Length As Single
            Get

                If Me._length Is Nothing Then
                    Me._length = CSng(Math.Sqrt(Math.Pow(Me.x, 2) + Math.Pow(Me.y, 2)))
                End If

                Return CSng(Me._length)
            End Get
        End Property

        Private Function polarity(ByVal value As Single) As Integer
            Return CInt(Math.Round(value / Math.Abs(value)))
        End Function

        Public Function GetResizedTo(ByVal length As Single) As Vector
            If Me.x = 0 And Me.y = 0 Then
                Return New Vector(0, 0)
            ElseIf Me.x = 0 Then
                Return New Vector(0, length * polarity(Me.y))
            ElseIf Me.y = 0 Then
                Return New Vector(length * polarity(Me.x), 0)
            Else
                Dim proportion = Math.Abs(Me.y / Me.x)
                Dim _x = Math.Sqrt(Math.Pow(length, 2) / (1 + Math.Pow(proportion, 2)))
                Dim _y = proportion * _x
                Return New Vector(CSng(_x * polarity(Me.x)), CSng(_y * polarity(Me.y)))
            End If
        End Function

        Public Function AngleTo(ByVal vectorB As Vector) As Single
            Dim divisor = Me.Length * vectorB.Length

            If divisor = 0 Then
                Return 0
            Else
                Return CSng(Math.Acos(Math.Min(Math.Max((Me.x * vectorB.x + Me.y * vectorB.y) / divisor, -1.0), 1.0)) / Math.PI)
            End If
        End Function
    End Class

    Public Class SVGConverter
        Protected Shared Function segmentToCurve(ByVal stroke As Integer()(), ByVal positionInStroke As Integer, ByVal lineCurveThreshold As Single) As String
            positionInStroke += 1
            Dim CDvector = New Vector(stroke(positionInStroke)(0), stroke(positionInStroke)(1))
            Dim BCvector = New Vector(stroke(positionInStroke - 1)(0), stroke(positionInStroke - 1)(1))
            Dim ABvector As Vector
            Dim rounding = 2
            Dim curvetemplate As String = "c {0} {1} {2} {3} {4} {5}"
            Dim linetemplate As String = "l {0} {1}"

            If BCvector.Length > lineCurveThreshold Then

                If positionInStroke > 2 Then
                    ABvector = New Vector(stroke(positionInStroke - 2)(0), stroke(positionInStroke - 2)(1))
                Else
                    ABvector = New Vector(0, 0)
                End If

                Dim minlenfraction = 0.05F
                Dim maxlen = BCvector.Length * 0.35
                Dim ABCangle = BCvector.AngleTo(ABvector.Reversed)
                Dim BCDangle = CDvector.AngleTo(BCvector.Reversed)
                Dim BtoCP1vector = New Vector(ABvector.x + BCvector.x, ABvector.y + BCvector.y).GetResizedTo(CSng((Math.Max(minlenfraction, ABCangle) * maxlen)))
                Dim CtoCP2vector = New Vector(BCvector.x + CDvector.x, BCvector.y + CDvector.y).Reversed.GetResizedTo(CSng((Math.Max(minlenfraction, BCDangle) * maxlen)))
                Dim BtoCP2vector = New Vector(BCvector.x + CtoCP2vector.x, BCvector.y + CtoCP2vector.y)
                Return String.Format(CultureInfo.InvariantCulture, curvetemplate, Math.Round(BtoCP1vector.x, rounding), Math.Round(BtoCP1vector.y, rounding), Math.Round(BtoCP2vector.x, rounding), Math.Round(BtoCP2vector.y, rounding), Math.Round(BCvector.x, rounding), Math.Round(BCvector.y, rounding))
            Else
                Return String.Format(CultureInfo.InvariantCulture, linetemplate, Math.Round(BCvector.x, rounding), Math.Round(BCvector.y, rounding))
            End If
        End Function

        Protected Shared Function lastSegmentToCurve(ByVal stroke As Integer()(), ByVal lineCurveThreshold As Single) As String
            Dim positionInStroke = stroke.Length - 1
            Dim BCvector = New Vector(stroke(positionInStroke)(0), stroke(positionInStroke)(1))
            Dim rounding = 2
            Dim curvetemplate As String = "c {0} {1} {2} {3} {4} {5}"
            Dim linetemplate As String = "l {0} {1}"

            If positionInStroke > 1 AndAlso BCvector.Length > lineCurveThreshold Then
                Dim ABvector = New Vector(stroke(positionInStroke - 1)(0), stroke(positionInStroke - 1)(1))
                Dim ABCangle = BCvector.AngleTo(ABvector.Reversed)
                Dim minlenfraction = 0.05
                Dim maxlen = BCvector.Length * 0.35
                Dim BtoCP1vector = New Vector(ABvector.x + BCvector.x, ABvector.y + BCvector.y).GetResizedTo(CSng((Math.Max(minlenfraction, ABCangle) * maxlen)))
                Return String.Format(CultureInfo.InvariantCulture, curvetemplate, Math.Round(BtoCP1vector.x, rounding), Math.Round(BtoCP1vector.y, rounding), Math.Round(BCvector.x, rounding), Math.Round(BCvector.y, rounding), Math.Round(BCvector.x, rounding), Math.Round(BCvector.y, rounding))
            Else
                Return String.Format(CultureInfo.InvariantCulture, linetemplate, Math.Round(BCvector.x, rounding), Math.Round(BCvector.y, rounding))
            End If
        End Function

        Public Shared Function GetPathsSVGFragment(ByVal data As Integer()()(), ByVal shiftx As Integer, ByVal shifty As Integer) As String
            Dim pathtemplate As String = "<path style='fill:none;stroke:#000000;stroke-width:2;stroke-linecap:round;stroke-linejoin:round' d='M {0} {1} {2}'/>".Replace("'", """")
            Dim lineCurveThreshold As Single = 0.5F
            Dim paths As List(Of String) = New List(Of String)()
            Dim pathfragments As List(Of String)

            For Each stroke As Integer()() In data
                pathfragments = New List(Of String)()
                Dim len As Integer = stroke.Length - 1
                Dim i As Integer = 1

                While i < len
                    pathfragments.Add(segmentToCurve(stroke, i, lineCurveThreshold))
                    i += 1
                End While

                If len > 0 Then
                    pathfragments.Add(lastSegmentToCurve(stroke, lineCurveThreshold))
                End If

                paths.Add(String.Format(CultureInfo.InvariantCulture, pathtemplate, stroke(0)(0) + shiftx, stroke(0)(1) + shifty, String.Join(" ", pathfragments.ToArray())))
            Next

            Return String.Join("", paths.ToArray())
        End Function

        Public Shared Function ToSVG(ByVal data As Integer()()()) As String
            ' Dim stats = New jSignature.Tools.Stats(data)
            Dim stats = New Stats(data)
            Dim contentsize = stats.ContentSize
            Dim limits = stats.ContentLimits
            Dim outersvgtemplate As String = "<?xml version='1.0' encoding='UTF-8' standalone='no'?>
<!DOCTYPE svg PUBLIC '-//W3C//DTD SVG 1.1//EN' 'http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd'>
<svg xmlns='http://www.w3.org/2000/svg' version='1.1' width='{0}' height='{1}'>{2}
</svg>".Replace("'", """")
            Return String.Format(CultureInfo.InvariantCulture, outersvgtemplate, contentsize(0), contentsize(1), GetPathsSVGFragment(data, limits(0) * -1 + 1, limits(1) * -1 + 1))
        End Function
    End Class
End Namespace
